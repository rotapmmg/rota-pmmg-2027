(() => {
  "use strict";

  const PAGE_ID = "premium";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const freeFeatures = [
    "Aulas selecionadas",
    "Questões demonstrativas",
    "Plano de estudos e metas",
    "Controle de desempenho básico"
  ];

  const premiumFeatures = [
    "Teoria completa organizada por matéria",
    "Videoaulas vinculadas às aulas",
    "Banco de questões separado da teoria",
    "Baterias de prática por disciplina",
    "Simulados completos",
    "Gabaritos comentados",
    "Estatísticas de desempenho",
    "Novos conteúdos e questões"
  ];

  function createPage() {
    if (document.getElementById(PAGE_ID)) return;

    const main = $(".main");
    if (!main) return;

    const section = document.createElement("section");
    section.id = PAGE_ID;
    section.className = "page premium-page";

    section.innerHTML = `
      <header class="premium-hero">
        <div>
          <span class="premium-kicker">ROTA PMMG PREMIUM</span>
          <h2>Estude a teoria. Depois pratique até dominar.</h2>
          <p>
            A área Premium agora separa o conteúdo teórico do banco de questões.
            Assim você consegue aprender a matéria sem interrupções e treinar em uma área própria.
          </p>
          <div class="premium-status">
            <span>Seu plano atual</span>
            <strong id="premiumCurrentPlan">GRÁTIS</strong>
          </div>
        </div>

        <div class="premium-badge">
          <span>★</span>
          <strong>PREMIUM</strong>
          <small>Rota PMMG 2027</small>
        </div>
      </header>

      <article class="panel premium-workspace">
        <div class="premium-workspace-head">
          <div>
            <span class="eyebrow">ÁREA DE PREPARAÇÃO</span>
            <h3>Escolha como estudar agora</h3>
          </div>
        </div>

        <div class="premium-mode-tabs" role="tablist" aria-label="Modos de estudo Premium">
          <button class="premium-mode-tab active" type="button" data-premium-mode="study" role="tab" aria-selected="true">
            <span>📚</span>
            <strong>Estudar</strong>
            <small>Teoria e videoaulas</small>
          </button>
          <button class="premium-mode-tab" type="button" data-premium-mode="practice" role="tab" aria-selected="false">
            <span>✍️</span>
            <strong>Praticar</strong>
            <small>Banco de questões</small>
          </button>
          <button class="premium-mode-tab" type="button" data-premium-mode="simulation" role="tab" aria-selected="false">
            <span>🎯</span>
            <strong>Simulados</strong>
            <small>Treino de prova</small>
          </button>
        </div>

        <div class="premium-mode-content">
          <section id="premiumStudySection" data-premium-mode-panel="study"></section>
          <section id="premiumPracticeSection" data-premium-mode-panel="practice" hidden></section>
          <section id="premiumSimulationSection" data-premium-mode-panel="simulation" hidden>
            <div class="premium-empty-state">
              <span class="premium-empty-icon">🎯</span>
              <h3>Central de simulados</h3>
              <p class="muted">
                Esta área está separada da teoria e do banco de questões. A próxima etapa vai conectar
                os simulados ao banco Premium sem misturar as funções.
              </p>
            </div>
          </section>
        </div>
      </article>

      <div class="premium-marketing" id="premiumMarketing">
        <div class="premium-grid">
          <article class="premium-card">
            <span class="eyebrow">PLANO ATUAL</span>
            <h3>Grátis</h3>
            <div class="premium-price">R$ 0</div>
            <p class="muted">Para conhecer a plataforma e começar a preparação.</p>
            <ul>
              ${freeFeatures.map(x => `<li>✓ ${x}</li>`).join("")}
            </ul>
            <button class="ghost-btn" disabled>Plano gratuito</button>
          </article>

          <article class="premium-card premium-card-paid">
            <span class="premium-recommended">MAIS COMPLETO</span>
            <span class="eyebrow">ROTA PREMIUM</span>
            <h3>Premium</h3>
            <div class="premium-price">Em breve</div>
            <p class="muted">Preparação completa e especializada para a PMMG.</p>
            <ul>
              ${premiumFeatures.map(x => `<li>★ ${x}</li>`).join("")}
            </ul>
            <button class="primary-btn" id="premiumInterest">Quero ser Premium</button>
            <small class="premium-note">Pagamento ainda não ativado.</small>
          </article>
        </div>
      </div>
    `;

    main.appendChild(section);
  }

  function addNav() {
    const nav = $(".sidebar .nav");
    if (nav && !$('[data-page="premium"]', nav)) {
      const button = document.createElement("button");
      button.className = "nav-item premium-nav";
      button.dataset.page = PAGE_ID;
      button.innerHTML = `★ <span>Premium</span><small>CURSO</small>`;
      nav.appendChild(button);
    }

    const sheet = $(".sheet-grid");
    if (sheet && !$('[data-sheet-page="premium"]', sheet)) {
      const button = document.createElement("button");
      button.className = "sheet-link";
      button.dataset.sheetPage = PAGE_ID;
      button.innerHTML = `<span>★</span><strong>Premium</strong><small>Estudar e praticar</small>`;
      sheet.appendChild(button);
    }
  }

  function addTopBadge() {
    const actions = $(".top-actions");
    if (!actions || $("#premiumTopBadge")) return;

    const badge = document.createElement("button");
    badge.id = "premiumTopBadge";
    badge.className = "premium-top-badge";
    badge.type = "button";
    badge.innerHTML = `★ <strong>GRÁTIS</strong>`;
    actions.insertBefore(badge, $("#themeToggle"));
  }

  function openPremium() {
    $$(".page").forEach(page => page.classList.toggle("active", page.id === PAGE_ID));
    $$("[data-page]").forEach(btn => btn.classList.toggle("active", btn.dataset.page === PAGE_ID));

    const title = $("#pageTitle");
    if (title) title.textContent = "Premium";

    $("#sidebar")?.classList.remove("open");
    $("#mobileSheet")?.classList.remove("open");
    document.body.style.overflow = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectMode(mode) {
    $$("[data-premium-mode]").forEach(button => {
      const active = button.dataset.premiumMode === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });

    $$("[data-premium-mode-panel]").forEach(panel => {
      panel.hidden = panel.dataset.premiumModePanel !== mode;
    });

    document.dispatchEvent(new CustomEvent("pmmg:premium-mode", { detail: { mode } }));
  }

  async function waitForFirebaseSync() {
    let attempts = 0;
    while (!window.firebaseSync && attempts < 40) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts += 1;
    }
    return window.firebaseSync || null;
  }

  function renderPlan(plan) {
    const isPremium = plan === "premium";
    const label = isPremium ? "PREMIUM" : "GRÁTIS";

    const currentPlan = $("#premiumCurrentPlan");
    if (currentPlan) currentPlan.textContent = label;

    const badgeLabel = $("#premiumTopBadge strong");
    if (badgeLabel) badgeLabel.textContent = label;

    const marketing = $("#premiumMarketing");
    if (marketing) marketing.hidden = isPremium;
  }

  async function refreshPlanStatus() {
    const firebase = await waitForFirebaseSync();
    if (!firebase) {
      renderPlan("free");
      return;
    }

    try {
      renderPlan(await firebase.loadUserPlan());
    } catch (error) {
      console.error("Não foi possível carregar o plano:", error);
      renderPlan("free");
    }
  }

  function bind() {
    $('[data-page="premium"]')?.addEventListener("click", event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      openPremium();
    });

    $('[data-sheet-page="premium"]')?.addEventListener("click", event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      openPremium();
    });

    $("#premiumTopBadge")?.addEventListener("click", openPremium);

    $$("[data-premium-mode]").forEach(button => {
      button.addEventListener("click", () => selectMode(button.dataset.premiumMode));
    });

    $("#premiumInterest")?.addEventListener("click", () => {
      localStorage.setItem("pmmgPremiumInterest", "true");
      const button = $("#premiumInterest");
      if (button) {
        button.textContent = "Interesse registrado ✓";
        button.disabled = true;
      }
      alert("A assinatura ainda não está ativa. Este botão será conectado ao pagamento depois.");
    });

    if (localStorage.getItem("pmmgPremiumInterest") === "true") {
      const button = $("#premiumInterest");
      if (button) {
        button.textContent = "Interesse registrado ✓";
        button.disabled = true;
      }
    }
  }

  async function watchPlan() {
    const firebase = await waitForFirebaseSync();
    if (!firebase) return;

    await refreshPlanStatus();
    firebase.observeFirebaseUser(() => refreshPlanStatus()).catch(error => {
      console.error("Não foi possível observar o plano Premium:", error);
    });
  }

  function init() {
    createPage();
    addNav();
    addTopBadge();
    bind();
    watchPlan();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();