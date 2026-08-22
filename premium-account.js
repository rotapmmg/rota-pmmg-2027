import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const $ = (selector, root = document) => root.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function waitForFirebaseSync() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (window.firebaseSync) return window.firebaseSync;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return null;
}

function formatDate(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") return "—";
  return timestamp.toDate().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function ensureStyles() {
  if ($("#premiumAccountStyles")) return;
  const style = document.createElement("style");
  style.id = "premiumAccountStyles";
  style.textContent = `
    .premium-account-card{display:grid;grid-template-columns:1fr auto;gap:10px 18px;align-items:center;margin-top:18px;padding:14px 16px;border:1px solid var(--line);border-radius:15px;background:var(--panel-2)}
    .premium-account-card strong{display:block;margin-top:3px}
    .premium-account-meta{display:flex;flex-wrap:wrap;gap:7px 14px;color:var(--muted);font-size:12px}
    .premium-account-actions{grid-column:2;grid-row:1 / 3}
    .premium-account-actions button{white-space:nowrap}
    @media(max-width:620px){.premium-account-card{grid-template-columns:1fr}.premium-account-actions{grid-column:1;grid-row:auto}.premium-account-actions button{width:100%}}
  `;
  document.head.appendChild(style);
}

function ensureHost() {
  const heroCopy = $(".premium-hero > div:first-child");
  if (!heroCopy) return null;
  let host = $("#premiumAccountCard");
  if (host) return host;
  host = document.createElement("div");
  host.id = "premiumAccountCard";
  host.className = "premium-account-card";
  host.innerHTML = `<div><span class="eyebrow">CONTA</span><strong>Carregando conta…</strong></div>`;
  heroCopy.appendChild(host);
  return host;
}

async function readAccount(firebase, user) {
  const services = firebase.getFirebaseServices?.();
  if (!services?.db || !user) return null;
  const snapshot = await getDoc(doc(services.db, "users", user.uid));
  return snapshot.exists() ? snapshot.data() : null;
}

async function renderAccount() {
  ensureStyles();
  const host = ensureHost();
  if (!host) return;

  const firebase = await waitForFirebaseSync();
  if (!firebase) {
    host.innerHTML = `<div><span class="eyebrow">CONTA</span><strong>Conta indisponível</strong></div>`;
    return;
  }

  const user = await firebase.getCurrentFirebaseUser();
  if (!user) {
    host.innerHTML = `
      <div>
        <span class="eyebrow">CONTA</span>
        <strong>Você ainda não entrou</strong>
        <div class="premium-account-meta"><span>Entre com Google antes de gerar o Pix.</span></div>
      </div>
      <div class="premium-account-actions"><button class="ghost-btn" id="premiumAccountLogin" type="button">Entrar com Google</button></div>`;
    $("#premiumAccountLogin", host)?.addEventListener("click", async () => {
      await firebase.loginWithGoogle();
      await renderAccount();
    });
    return;
  }

  let account = null;
  try {
    account = await readAccount(firebase, user);
  } catch (error) {
    console.warn("Não foi possível carregar os detalhes da assinatura.", error);
  }

  const premiumUntil = account?.premiumUntil;
  const premiumUntilMs = typeof premiumUntil?.toMillis === "function" ? premiumUntil.toMillis() : 0;
  const isPremium = account?.plan === "premium" && premiumUntilMs > Date.now();
  const planLabel = isPremium ? "Premium ativo" : "Plano grátis";
  const validity = isPremium ? `Acesso até ${formatDate(premiumUntil)}` : "Sem assinatura ativa";

  host.innerHTML = `
    <div>
      <span class="eyebrow">CONTA</span>
      <strong>${escapeHtml(user.email || "Conta Google")}</strong>
      <div class="premium-account-meta"><span>${planLabel}</span><span>${validity}</span></div>
    </div>
    <div class="premium-account-actions"><button class="ghost-btn" id="premiumAccountLogout" type="button">Sair</button></div>`;

  $("#premiumAccountLogout", host)?.addEventListener("click", async () => {
    await firebase.logoutFromGoogle();
    await renderAccount();
  });
}

async function init() {
  const firebase = await waitForFirebaseSync();
  await renderAccount();
  if (firebase?.observeFirebaseUser) {
    firebase.observeFirebaseUser(() => {
      setTimeout(() => void renderAccount(), 0);
    }).catch(error => console.warn("Não foi possível observar a conta Premium.", error));
  }
  document.addEventListener("pmmg:premium-activated", () => void renderAccount());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void init(), { once: true });
} else {
  void init();
}
