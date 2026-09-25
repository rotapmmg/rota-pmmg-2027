const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();

const db = admin.firestore();

const MP_ACCESS_TOKEN = defineSecret("MP_ACCESS_TOKEN");
const MP_WEBHOOK_SECRET = defineSecret("MP_WEBHOOK_SECRET");

const APP_ORIGIN = "https://rotapmmg.github.io";
const WEBHOOK_PATH = "/mercadoPagoWebhook";

function json(res, status, body) {
  res.status(status).set("Content-Type", "application/json").send(JSON.stringify(body));
}

function getBearerToken(req) {
  const header = req.get("Authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

async function requireUser(req) {
  const token = getBearerToken(req);
  if (!token) {
    const error = new Error("AUTH_REQUIRED");
    error.status = 401;
    throw error;
  }

  return admin.auth().verifyIdToken(token);
}

async function mercadoPagoRequest(path, options = {}) {
  const token = MP_ACCESS_TOKEN.value();
  if (!token) throw new Error("MP_ACCESS_TOKEN não configurado.");

  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(data.message || data.error || "Mercado Pago retornou um erro.");
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

function buildWebhookSignatureBase(id, requestId, ts) {
  return `id:${id};request-id:${requestId};ts:${ts};`;
}

function isValidWebhookSignature(req) {
  const secret = MP_WEBHOOK_SECRET.value();
  if (!secret) return false;

  const signature = req.get("x-signature") || "";
  const requestId = req.get("x-request-id") || "";
  const notificationId = String(
    req.query?.["data.id"] ||
    req.body?.data?.id ||
    req.query?.id ||
    ""
  ).toLowerCase();

  const parts = Object.fromEntries(
    signature.split(",").map(part => {
      const [key, value] = part.trim().split("=", 2);
      return [key, value];
    }).filter(([key, value]) => key && value)
  );

  if (!parts.ts || !parts.v1 || !requestId || !notificationId) return false;

  const manifest = buildWebhookSignatureBase(notificationId, requestId, parts.ts);
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const received = Buffer.from(parts.v1);
  const calculated = Buffer.from(expected);

  return received.length === calculated.length &&
    crypto.timingSafeEqual(received, calculated);
}

function isPremiumSubscriptionStatus(status) {
  return ["authorized", "active"].includes(String(status || "").toLowerCase());
}

function isInactiveSubscriptionStatus(status) {
  return ["paused", "cancelled", "canceled", "expired"].includes(String(status || "").toLowerCase());
}

async function resolvePremiumPlanId() {
  const params = new URLSearchParams({
    status: "active",
    q: "Rota pmmg premium"
  });

  const data = await mercadoPagoRequest(`/preapproval_plan/search?${params.toString()}`);
  const candidates = Array.isArray(data.results) ? data.results : [];

  const matches = candidates.filter(plan => {
    const recurring = plan.auto_recurring || {};
    const amount = Number(recurring.transaction_amount);
    return String(plan.reason || "").trim().toLowerCase() === "rota pmmg premium" &&
      amount === 25.9 &&
      String(recurring.currency_id || "").toUpperCase() === "BRL" &&
      Number(recurring.frequency) === 1 &&
      String(recurring.frequency_type || "").toLowerCase() === "months" &&
      String(plan.status || "").toLowerCase() === "active";
  });

  if (matches.length !== 1) {
    const error = new Error(
      matches.length === 0
        ? "Não foi possível localizar exatamente um plano ativo 'Rota pmmg premium' de R$ 25,90/mês."
        : "Foram encontrados vários planos compatíveis. Configure MP_PREAPPROVAL_PLAN_ID para selecionar o correto."
    );
    error.status = 500;
    throw error;
  }

  return String(matches[0].id);
}

async function updateUserSubscription(uid, subscription) {
  const status = String(subscription.status || "").toLowerCase();

  let plan = "free";
  if (isPremiumSubscriptionStatus(status)) plan = "premium";
  if (isInactiveSubscriptionStatus(status)) plan = "free";

  await db.doc(`users/${uid}`).set({
    plan,
    subscriptionStatus: status || "unknown",
    mercadoPagoSubscriptionId: String(subscription.id || ""),
    subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { plan, subscriptionStatus: status || "unknown" };
}

exports.createPremiumSubscription = onRequest(
  {
    region: "southamerica-east1",
    secrets: [MP_ACCESS_TOKEN],
    cors: true
  },
  async (req, res) => {
    if (req.method !== "POST") return json(res, 405, { error: "Método não permitido." });

    try {
      const user = await requireUser(req);
      if (!user.email) return json(res, 400, { error: "A conta Google não possui e-mail disponível." });

      const planId = await resolvePremiumPlanId();

      const existing = await db.doc(`users/${user.uid}`).get();
      const existingData = existing.exists ? existing.data() : {};
      if (existingData?.plan === "premium" && existingData?.subscriptionStatus === "authorized") {
        return json(res, 409, { error: "Esta conta já possui Premium ativo." });
      }

      const subscription = await mercadoPagoRequest("/preapproval", {
        method: "POST",
        body: JSON.stringify({
          preapproval_plan_id: planId,
          external_reference: user.uid,
          payer_email: user.email,
          back_url: APP_ORIGIN
        })
      });

      await db.doc(`users/${user.uid}`).set({
        mercadoPagoSubscriptionId: String(subscription.id || ""),
        subscriptionStatus: String(subscription.status || "pending").toLowerCase(),
        subscriptionCreatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return json(res, 200, {
        subscriptionId: subscription.id,
        initPoint: subscription.init_point
      });
    } catch (error) {
      logger.error("Erro ao criar assinatura Premium", error);
      return json(res, error.status || 500, {
        error: error.message || "Não foi possível iniciar a assinatura."
      });
    }
  }
);

exports.mercadoPagoWebhook = onRequest(
  {
    region: "southamerica-east1",
    secrets: [MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET]
  },
  async (req, res) => {
    if (req.method !== "POST") return json(res, 405, { error: "Método não permitido." });

    try {
      if (!isValidWebhookSignature(req)) {
        return json(res, 401, { error: "Assinatura do webhook inválida." });
      }

      const type = String(req.body?.type || req.query?.type || "");
      const resourceId = String(
        req.body?.data?.id ||
        req.query?.["data.id"] ||
        req.query?.id ||
        ""
      );

      if (type !== "subscription_preapproval" || !resourceId) {
        return json(res, 200, { received: true, ignored: true });
      }

      const subscription = await mercadoPagoRequest(`/preapproval/${encodeURIComponent(resourceId)}`);
      const uid = String(subscription.external_reference || "");

      if (!uid) {
        logger.warn("Assinatura recebida sem external_reference", { resourceId });
        return json(res, 200, { received: true, updated: false });
      }

      await updateUserSubscription(uid, subscription);

      await db.collection("mercadoPagoWebhookEvents").doc(resourceId).set({
        type,
        subscriptionId: resourceId,
        status: String(subscription.status || ""),
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return json(res, 200, { received: true, updated: true });
    } catch (error) {
      logger.error("Erro no webhook do Mercado Pago", error);
      return json(res, 500, { error: "Falha ao processar webhook." });
    }
  }
);

exports.syncPremiumSubscription = onRequest(
  {
    region: "southamerica-east1",
    secrets: [MP_ACCESS_TOKEN]
  },
  async (req, res) => {
    if (req.method !== "POST") return json(res, 405, { error: "Método não permitido." });

    try {
      const user = await requireUser(req);
      const userSnapshot = await db.doc(`users/${user.uid}`).get();
      const subscriptionId = userSnapshot.exists ? userSnapshot.data()?.mercadoPagoSubscriptionId : null;

      if (!subscriptionId) return json(res, 404, { error: "Nenhuma assinatura encontrada para esta conta." });

      const subscription = await mercadoPagoRequest(`/preapproval/${encodeURIComponent(subscriptionId)}`);
      if (String(subscription.external_reference || "") !== user.uid) {
        return json(res, 403, { error: "Assinatura não pertence a esta conta." });
      }

      const result = await updateUserSubscription(user.uid, subscription);
      return json(res, 200, result);
    } catch (error) {
      logger.error("Erro ao sincronizar assinatura Premium", error);
      return json(res, error.status || 500, { error: error.message || "Não foi possível sincronizar a assinatura." });
    }
  }
);
