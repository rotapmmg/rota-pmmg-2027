const crypto = require("crypto");
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();
const mercadoPagoAccessToken = defineSecret("MERCADO_PAGO_ACCESS_TOKEN");
const mercadoPagoWebhookSecret = defineSecret("MERCADO_PAGO_WEBHOOK_SECRET");

const PREMIUM_PRICE = 30;
const PREMIUM_DURATION_DAYS = 30;
const REGION = "southamerica-east1";

function json(res, status, payload) {
  res.status(status).set("Content-Type", "application/json; charset=utf-8").send(JSON.stringify(payload));
}

function normalizeCpf(value) {
  return String(value || "").replace(/\D/g, "");
}

async function requireUser(req) {
  const header = String(req.headers.authorization || "");
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw Object.assign(new Error("Autenticação obrigatória."), { status: 401 });
  return getAuth().verifyIdToken(match[1]);
}

async function mercadoPagoRequest(path, options = {}) {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${mercadoPagoAccessToken.value()}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(`Mercado Pago respondeu ${response.status}.`);
    error.status = 502;
    error.details = body;
    throw error;
  }

  return body;
}

function paymentQrData(payment) {
  const tx = payment?.point_of_interaction?.transaction_data || {};
  return {
    paymentId: String(payment?.id || ""),
    status: String(payment?.status || "pending"),
    amount: PREMIUM_PRICE,
    durationDays: PREMIUM_DURATION_DAYS,
    qrCode: String(tx.qr_code || ""),
    qrCodeBase64: String(tx.qr_code_base64 || ""),
    ticketUrl: String(tx.ticket_url || ""),
    expiresAt: payment?.date_of_expiration || null
  };
}

exports.createPixPayment = onRequest(
  {
    region: REGION,
    cors: true,
    secrets: [mercadoPagoAccessToken]
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.set("Allow", "POST");
      return json(res, 405, { error: "method_not_allowed" });
    }

    try {
      const user = await requireUser(req);
      const cpf = normalizeCpf(req.body?.cpf);
      if (cpf.length !== 11) return json(res, 400, { error: "cpf_invalid" });
      if (!user.email) return json(res, 400, { error: "email_required" });

      const idempotencyKey = crypto.randomUUID();
      const payment = await mercadoPagoRequest("/v1/payments", {
        method: "POST",
        headers: {
          "X-Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({
          transaction_amount: PREMIUM_PRICE,
          description: "Rota PMMG Premium - 1 mês",
          payment_method_id: "pix",
          external_reference: user.uid,
          payer: {
            email: user.email,
            identification: {
              type: "CPF",
              number: cpf
            }
          },
          metadata: {
            user_id: user.uid,
            product: "rota_pmmg_premium_1_mes",
            duration_days: PREMIUM_DURATION_DAYS
          }
        })
      });

      const paymentId = String(payment.id);
      await db.doc(`billingPayments/${paymentId}`).set({
        userId: user.uid,
        provider: "mercado_pago",
        method: "pix",
        amount: PREMIUM_PRICE,
        durationDays: PREMIUM_DURATION_DAYS,
        status: String(payment.status || "pending"),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      return json(res, 201, paymentQrData(payment));
    } catch (error) {
      console.error("createPixPayment", error, error?.details || "");
      return json(res, Number(error.status || 500), {
        error: "pix_create_failed",
        message: error.message
      });
    }
  }
);

function parseSignature(header) {
  const result = {};
  String(header || "").split(",").forEach(part => {
    const [key, value] = part.split("=", 2).map(item => String(item || "").trim());
    if (key && value) result[key] = value;
  });
  return result;
}

function validateWebhookSignature(req, paymentId) {
  const signature = parseSignature(req.headers["x-signature"]);
  const requestId = String(req.headers["x-request-id"] || "");
  if (!signature.ts || !signature.v1 || !requestId || !paymentId) return false;

  const manifest = `id:${String(paymentId).toLowerCase()};request-id:${requestId};ts:${signature.ts};`;
  const calculated = crypto
    .createHmac("sha256", mercadoPagoWebhookSecret.value())
    .update(manifest)
    .digest("hex");

  const expected = Buffer.from(signature.v1, "utf8");
  const actual = Buffer.from(calculated, "utf8");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function addPremiumPeriod(baseDate) {
  return new Date(baseDate.getTime() + PREMIUM_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

async function activateApprovedPayment(payment) {
  const paymentId = String(payment.id || "");
  const userId = String(payment.external_reference || payment.metadata?.user_id || "");
  const amount = Number(payment.transaction_amount || 0);
  const method = String(payment.payment_method_id || "");

  if (!paymentId || !userId) throw new Error("Pagamento sem vínculo de usuário.");
  if (payment.status !== "approved") return false;
  if (amount !== PREMIUM_PRICE || method !== "pix") throw new Error("Pagamento aprovado não corresponde ao produto Premium esperado.");

  const paymentRef = db.doc(`billingPayments/${paymentId}`);
  const userRef = db.doc(`users/${userId}`);

  await db.runTransaction(async tx => {
    const [paymentSnap, userSnap] = await Promise.all([tx.get(paymentRef), tx.get(userRef)]);
    if (paymentSnap.exists && paymentSnap.data()?.activatedAt) return;

    const now = new Date();
    const currentUntil = userSnap.exists && userSnap.data()?.premiumUntil instanceof Timestamp
      ? userSnap.data().premiumUntil.toDate()
      : null;
    const base = currentUntil && currentUntil > now ? currentUntil : now;
    const premiumUntil = addPremiumPeriod(base);

    tx.set(userRef, {
      plan: "premium",
      premiumUntil: Timestamp.fromDate(premiumUntil),
      billingProvider: "mercado_pago",
      billingMethod: "pix",
      lastPaymentId: paymentId,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    tx.set(paymentRef, {
      userId,
      provider: "mercado_pago",
      method: "pix",
      amount: PREMIUM_PRICE,
      status: "approved",
      approvedAt: payment.date_approved ? Timestamp.fromDate(new Date(payment.date_approved)) : FieldValue.serverTimestamp(),
      activatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });

  return true;
}

exports.mercadoPagoWebhook = onRequest(
  {
    region: REGION,
    cors: false,
    secrets: [mercadoPagoAccessToken, mercadoPagoWebhookSecret]
  },
  async (req, res) => {
    try {
      const paymentId = String(req.query?.["data.id"] || req.query?.data_id || req.body?.data?.id || "");
      const type = String(req.query?.type || req.body?.type || "");

      if (!paymentId || (type && type !== "payment")) return json(res, 200, { received: true });
      if (!validateWebhookSignature(req, paymentId)) return json(res, 401, { error: "invalid_signature" });

      const payment = await mercadoPagoRequest(`/v1/payments/${encodeURIComponent(paymentId)}`, { method: "GET" });

      await db.doc(`billingPayments/${paymentId}`).set({
        userId: String(payment.external_reference || payment.metadata?.user_id || ""),
        provider: "mercado_pago",
        method: String(payment.payment_method_id || ""),
        amount: Number(payment.transaction_amount || 0),
        status: String(payment.status || "unknown"),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      if (payment.status === "approved") await activateApprovedPayment(payment);
      return json(res, 200, { received: true });
    } catch (error) {
      console.error("mercadoPagoWebhook", error, error?.details || "");
      return json(res, 500, { error: "webhook_failed" });
    }
  }
);

exports.expirePremiumPlans = onSchedule(
  {
    region: REGION,
    schedule: "every day 03:15",
    timeZone: "America/Sao_Paulo"
  },
  async () => {
    const now = Timestamp.now();
    const expired = await db.collection("users").where("premiumUntil", "<=", now).get();
    if (expired.empty) return;

    let batch = db.batch();
    let count = 0;
    for (const snap of expired.docs) {
      if (snap.data()?.plan !== "premium") continue;
      batch.set(snap.ref, {
        plan: "free",
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      count += 1;
      if (count % 400 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    if (count % 400 !== 0) await batch.commit();
  }
);
