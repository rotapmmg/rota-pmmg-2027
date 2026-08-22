(() => {
  "use strict";

  const CREATE_PIX_URL = "https://southamerica-east1-rota-pmmg-2027.cloudfunctions.net/createPixPayment";
  const PRICE_LABEL = "R$ 30,00";
  const PLAN_DAYS = 30;
  const $ = (selector, root = document) => root.querySelector(selector);

  function ensureStyles() {
    if ($("#premiumBillingStyles")) return;
    const style = document.createElement("style");
    style.id = "premiumBillingStyles";
    style.textContent = `
      .premium-billing-modal{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.68)}
      .premium-billing-dialog{width:min(520px,100%);max-height:92vh;overflow:auto;padding:24px;border:1px solid var(--line);border-radius:22px;background:var(--panel);box-shadow:var(--shadow);color:var(--text)}
      .premium-billing-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
      .premium-billing-head h3{margin:6px 0 0;font:700 30px Oswald}
      .premium-billing-close{border:1px solid var(--line);background:transparent;color:var(--text);border-radius:10px;padding:8px 10px;cursor:pointer}
      .premium-billing-plan{display:flex;justify-content:space-between;gap:14px;margin:18px 0;padding:14px;border:1px solid rgba(241,185,90,.3);border-radius:14px;background:rgba(241,185,90,.07)}
      .premium-billing-plan strong{color:var(--warning)}
      .premium-billing-field{display:grid;gap:7px;margin:14px 0}
      .premium-billing-field input{width:100%;padding:13px;border:1px solid var(--line);border-radius:12px;background:var(--panel-2);color:var(--text)}
      .premium-billing-status{margin-top:12px;color:var(--muted);line-height:1.5}
      .premium-pix-box{display:grid;justify-items:center;gap:14px;margin-top:18px;text-align:center}
      .premium-pix-box img{width:min(260px,80vw);aspect-ratio:1;border-radius:14px;background:#fff;padding:10px}
      .premium-pix-code{width:100%;min-height:90px;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--panel-2);color:var(--text);resize:vertical}
      .premium-billing-actions{display:grid;gap:10px;margin-top:14px}
    `;
    document.head.appendChild(style);
  }

  function configureMarketing() {
    const card = $(".premium-card-paid");
    if (!card) return false;

    const price = $(".premium-price", card);
    if (price) price.innerHTML = `${PRICE_LABEL} <small style="font:600 13px Inter;color:var(--muted)">/ 30 dias</small>`;

    const button = $("#premiumInterest", card);
    if (button) button.textContent = "Assinar Premium com Pix";

    const note = $(".premium-note", card);
    if (note) note.textContent = "Pagamento via Mercado Pago • acesso por 30 dias após a confirmação.";

    return true;
  }

  function closeModal() {
    $("#premiumBillingModal")?.remove();
  }

  function modalTemplate() {
    return `
      <div class="premium-billing-modal" id="premiumBillingModal" role="dialog" aria-modal="true" aria-labelledby="premiumBillingTitle">
        <div class="premium-billing-dialog">
          <div class="premium-billing-head">
            <div><span class="eyebrow">MERCADO PAGO • PIX</span><h3 id="premiumBillingTitle">Ativar Rota Premium</h3></div>
            <button class="premium-billing-close" type="button" data-billing-close>✕</button>
          </div>
          <div class="premium-billing-plan"><span>Premium por 30 dias</span><strong>${PRICE_LABEL}</strong></div>
          <p class="muted">Após a aprovação do Pix, o acesso Premium é liberado automaticamente na sua conta Google.</p>
          <div class="premium-billing-field">
            <label for="premiumBillingCpf">CPF do pagador</label>
            <input id="premiumBillingCpf" inputmode="numeric" autocomplete="off" maxlength="14" placeholder="000.000.000-00" />
          </div>
          <div class="premium-billing-actions">
            <button class="primary-btn" id="premiumBillingGenerate" type="button">Gerar Pix de ${PRICE_LABEL}</button>
          </div>
          <div class="premium-billing-status" id="premiumBillingStatus">Entre com Google e gere o Pix para continuar.</div>
          <div id="premiumPixResult"></div>
        </div>
      </div>`;
  }

  function openModal() {
    ensureStyles();
    closeModal();
    document.body.insertAdjacentHTML("beforeend", modalTemplate());
    $("[data-billing-close]")?.addEventListener("click", closeModal);
    $("#premiumBillingModal")?.addEventListener("click", event => {
      if (event.target.id === "premiumBillingModal") closeModal();
    });
    $("#premiumBillingGenerate")?.addEventListener("click", () => void createPix());
    $("#premiumBillingCpf")?.focus();
  }

  function setStatus(text) {
    const status = $("#premiumBillingStatus");
    if (status) status.textContent = text;
  }

  async function ensureUser() {
    const firebase = window.firebaseSync;
    if (!firebase) throw new Error("Login ainda está carregando.");
    let user = await firebase.getCurrentFirebaseUser();
    if (user) return user;
    const result = await firebase.loginWithGoogle();
    user = result?.user || await firebase.getCurrentFirebaseUser();
    if (!user) throw new Error("Conclua o login com Google para gerar o Pix.");
    return user;
  }

  function renderPix(data) {
    const host = $("#premiumPixResult");
    if (!host) return;
    const image = data.qrCodeBase64
      ? `<img alt="QR Code Pix" src="data:image/png;base64,${data.qrCodeBase64}">`
      : "";
    const code = String(data.qrCode || "");
    host.innerHTML = `
      <div class="premium-pix-box">
        <strong>Pix gerado. Pague ${PRICE_LABEL} no seu banco.</strong>
        ${image}
        <textarea class="premium-pix-code" id="premiumPixCode" readonly>${code}</textarea>
        <button class="ghost-btn" id="premiumPixCopy" type="button">Copiar Pix copia e cola</button>
        <small class="muted">A tela pode permanecer aberta. Assim que o Mercado Pago confirmar, o Premium será liberado automaticamente.</small>
      </div>`;
    $("#premiumPixCopy")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code);
        $("#premiumPixCopy").textContent = "Pix copiado ✓";
      } catch {
        $("#premiumPixCode")?.select();
      }
    });
  }

  async function waitForActivation() {
    const firebase = window.firebaseSync;
    for (let attempt = 0; attempt < 75; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 4000));
      try {
        const plan = await firebase.loadUserPlan();
        if (plan === "premium") {
          setStatus("Pagamento confirmado. Premium liberado por 30 dias ✓");
          const button = $("#premiumBillingGenerate");
          if (button) {
            button.textContent = "Premium ativado ✓";
            button.disabled = true;
          }
          document.dispatchEvent(new CustomEvent("pmmg:premium-activated"));
          return;
        }
      } catch (error) {
        console.warn("Aguardando confirmação do Premium…", error);
      }
    }
    setStatus("O Pix ainda não foi confirmado. Se você já pagou, feche esta tela e confira novamente em alguns minutos.");
  }

  async function createPix() {
    const button = $("#premiumBillingGenerate");
    const cpf = String($("#premiumBillingCpf")?.value || "").replace(/\D/g, "");
    if (cpf.length !== 11) {
      setStatus("Informe um CPF com 11 dígitos para gerar o Pix.");
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Gerando Pix…";
    }

    try {
      setStatus("Validando sua conta Google…");
      const user = await ensureUser();
      const token = await user.getIdToken();
      setStatus("Gerando cobrança segura no Mercado Pago…");

      const response = await fetch(CREATE_PIX_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cpf })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Não foi possível gerar o Pix.");
      if (!data.qrCode && !data.qrCodeBase64) throw new Error("O Mercado Pago não retornou o QR Code Pix.");

      renderPix(data);
      setStatus("Pix aguardando pagamento.");
      if (button) button.textContent = "Pix gerado";
      void waitForActivation();
    } catch (error) {
      console.error("Falha ao gerar Pix Premium:", error);
      setStatus(error.message || "Não foi possível gerar o Pix agora.");
      if (button) {
        button.disabled = false;
        button.textContent = `Gerar Pix de ${PRICE_LABEL}`;
      }
    }
  }

  document.addEventListener("click", event => {
    const button = event.target.closest?.("#premiumInterest");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openModal();
  }, true);

  const observer = new MutationObserver(() => {
    if (configureMarketing()) observer.disconnect();
  });

  function init() {
    ensureStyles();
    if (!configureMarketing()) observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
