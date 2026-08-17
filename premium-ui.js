(() => {
  "use strict";

  const PAGE_ID = "premium";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const modeMeta = {
    study: { icon: "📚", label: "Estudar", detail: "Teoria e videoaulas", title: "Premium — Estudar" },
    practice: { icon: "✍️", label: "Praticar", detail: "Banco de questões", title: "Premium — Praticar" },
    simulation: { icon: "🎯", label: "Simulados", detail: "Treino de prova", title: "Premium — Simulados" }
  };

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
            A área Premium separa o conteúdo teórico do banco de questões.
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
                Esta área está separada da teoria e do banco de questões. Os simulados serão conectados
                ao banco Premium sem misturar as funções.
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

  function makeSectionLabel(text, id) {
    const label = document.createElement("div");
    label.className = "nav-section-label";
    label.id = id;
    label.textContent = text;
    return label;
  }

  function makePremiumSidebarButton(mode) {
    const meta = modeMeta[mode];
    const button = document.createElement("button");
    button.className = "nav-item premium-resource-nav";
    button.type = "button";
    button.dataset.premiumSidebar = mode;
    button.setAttribute("aria-label", `${meta.label} no Premium`);
    button.innerHTML = `<span class="premium-resource-icon">${meta.icon}</span><span>${meta.label}</span>`;
    return button;
  }

  function organizeSidebar() {
    const sidebar = $(".sidebar");
    const nav = $(".sidebar .nav");
    if (!sidebar || !nav || nav.dataset.organized === "true") return;

    const dashboard = $('[data-page="dashboard"]', nav);
    const disciplinas = $('[data-page="disciplinas"]', nav);
    const taf = $('[data-page="taf"]', nav);

    if (dashboard && !$("#navSectionMain")) {
      nav.insertBefore(makeSectionLabel("PRINCIPAL", "navSectionMain"), dashboard);
    }

    if (disciplinas && !$("#navSectionStudy")) {
      nav.insertBefore(makeSectionLabel("ESTUDO", "navSectionStudy"), disciplinas);
    }

    if (taf && !$("#navSectionPremium")) {
      nav.insertBefore(makeSectionLabel("PREMIUM", "navSectionPremium"), taf);
      Object.keys(modeMeta).forEach(mode => nav.insertBefore(makePremiumSidebarButton(mode), taf));
      nav.insertBefore(makeSectionLabel("PREPARAÇÃO", "navSectionPreparation"), taf);
    }

    const exportButton = $("#exportBackupMenu");
    if (exportButton && !$("#navSectionData")) {
      sidebar.insertBefore(makeSectionLabel("DADOS", "navSectionData"), exportButton);
    }

    nav.dataset.organized = "true";
  }

  function addMobilePremiumNav() {
    const sheet = $(".sheet-grid");
    if (!sheet || $("#premiumSheetSection")) return;

    const label = document.createElement("div");
    label.id = "premiumSheetSection";
    label.className = "sheet-section-title";
    label.innerHTML = `<span>★</span><strong>Premium</strong>`;
    sheet.appendChild(label);

    Object.entries(modeMeta).forEach(([mode, meta]) => {
      const button = document.createElement("button");
      button.className = "sheet-link sheet-link-premium";
      button.type = "button";
      button.dataset.premiumSheet = mode;
      button.innerHTML = `<span>${meta.icon}</span><strong>${meta.label}</strong><small>${meta.detail}</small>`;
      sheet.appendChild(button);
    });
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

  function addPageFooter() {
    const main = $(".main");
    if (!main || $("#sitePageFooter")) return;

    const footer = document.createElement("footer");
    footer.id = "sitePageFooter";
    footer.className = "site-page-footer";
    footer.innerHTML = `
      <div class="site-page-footer-card">
        <div class="site-page-footer-copy">
          <span class="eyebrow">ROTA PMMG 2027</span>
          <strong>Continue pelo próximo bloco de preparação.</strong>
          <small>Os recursos Premium também ficam disponíveis diretamente no menu lateral.</small>
        </div>
        <div class="site-page-footer-actions" aria-label="Atalhos Premium">
          <button type="button" data-premium-shortcut="study">📚 Estudar</button>
          <button type="button" data-premium-shortcut="practice">✍️ Praticar</button>
          <button type="button" data-premium-shortcut="simulation">🎯 Simulados</button>
        </div>
      </div>
    `;
    main.appendChild(footer);
  }

  function setPremiumNavigationState(mode) {
    $$("[data-premium-sidebar]").forEach(button => {
      const active = button.dataset.premiumSidebar === mode;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    $$("[data-premium-sheet]").forEach(button => {
      button.classList.toggle("active", button.dataset.premiumSheet === mode);
    });

    $("#moreMenuBtn")?.classList.add("active");
  }

  function clearPremiumNavigationState() {
    $$("[data-premium-sidebar], [data-premium-sheet]").forEach(button => {
      button.classList.remove("active");
      button.removeAttribute("aria-current");
    });
    $("#moreMenuBtn")?.classList.remove("active");
  }

  function openPremium(mode = "study") {
    const safeMode = modeMeta[mode] ? mode : "study";

    $$(".page").forEach(page => page.classList.toggle("active", page.id === PAGE_ID));
    $$("[data-page]").forEach(btn => btn.classList.remove("active"));
    $$("[data-mobile-page]").forEach(btn => btn.classList.remove("active"));

    selectMode(safeMode);
    setPremiumNavigationState(safeMode);

    const title = $("#pageTitle");
    if (title) title.textContent = modeMeta[safeMode].title;

    $("#sidebar")?.classList.remove("open");
    $("#mobileSheet")?.classList.remove("open");
    document.body.style.overflow = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectMode(mode) {
    const safeMode = modeMeta[mode] ? mode : "study";

    $$("[data-premium-mode]").forEach(button => {
      const active = button.dataset.premiumMode === safeMode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });

    $$("[data-premium-mode-panel]").forEach(panel => {
      panel.hidden = panel.dataset.premiumModePanel !== safeMode;
    });

    if ($(`#${PAGE_ID}`)?.classList.contains("active")) {
      setPremiumNavigationState(safeMode);
      const title = $("#pageTitle");
      if (title) title.textContent = modeMeta[safeMode].title;
    }

    document.dispatchEvent(new CustomEvent("pmmg:premium-mode", { detail: { mode: safeMode } }));
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
    $$("[data-premium-sidebar]").forEach(button => {
      button.addEventListener("click", () => openPremium(button.dataset.premiumSidebar));
    });

    $$("[data-premium-sheet]").forEach(button => {
      button.addEventListener("click", () => openPremium(button.dataset.premiumSheet));
    });

    $$("[data-premium-shortcut]").forEach(button => {
      button.addEventListener("click", () => openPremium(button.dataset.premiumShortcut));
    });

    $("#premiumTopBadge")?.addEventListener("click", () => openPremium("study"));

    $$("[data-premium-mode]").forEach(button => {
      button.addEventListener("click", () => selectMode(button.dataset.premiumMode));
    });

    $$("[data-page], [data-mobile-page], [data-sheet-page]").forEach(button => {
      button.addEventListener("click", clearPremiumNavigationState);
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
    organizeSidebar();
    addMobilePremiumNav();
    addTopBadge();
    addPageFooter();
    bind();
    watchPlan();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();