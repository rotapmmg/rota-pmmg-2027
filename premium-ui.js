(() => {
  "use strict";

  const PAGE_ID = "premium";
  const PREMIUM_TEST_LESSON_ID = "aula-001";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const escapeHtml = value =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const freeFeatures = [
    "Aulas selecionadas",
    "Questões básicas",
    "Flashcards essenciais",
    "Treinos básicos",
    "Simulado demonstrativo",
    "Progresso básico"
  ];

  const premiumFeatures = [
    "Todas as aulas",
    "Banco completo de questões",
    "Todos os flashcards",
    "Treinos ilimitados",
    "Simulados completos",
    "Caderno de erros completo",
    "Estatísticas avançadas",
    "Novos conteúdos"
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
          <h2>Mais conteúdo, mais treino e uma preparação completa.</h2>
          <p>
            Continue gratuitamente ou desbloqueie todos os recursos
            quando a assinatura Premium for ativada.
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

      <article class="panel premium-compare" id="premiumProtectedTestCard">
        <span class="eyebrow">TESTE DE SEGURANÇA PREMIUM</span>
        <h3>Aula Premium protegida</h3>
        <p class="muted">
          Use este botão para testar a aula <strong>aula-001</strong> armazenada
          em <strong>premiumLessons</strong>. O Firestore decide se sua conta pode ler o conteúdo.
        </p>
        <button class="primary-btn" id="loadPremiumTestLesson" type="button">
          🔐 Abrir aula Premium de teste
        </button>
        <div id="premiumTestResult" class="lesson-block" hidden>
          <h3 id="premiumTestTitle"></h3>
          <p id="premiumTestContent"></p>
          <small id="premiumTestStatus" class="premium-note"></small>
        </div>
      </article>

      <div class="premium-grid">
        <article class="premium-card">
          <span class="eyebrow">PLANO ATUAL</span>
          <h3>Grátis</h3>
          <div class="premium-price">R$ 0</div>
          <p class="muted">Para conhecer a plataforma e começar a estudar.</p>
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
          <p class="muted">A experiência completa para quem quer intensificar a preparação.</p>
          <ul>
            ${premiumFeatures.map(x => `<li>★ ${x}</li>`).join("")}
          </ul>
          <button class="primary-btn" id="premiumInterest">Quero ser Premium</button>
          <small class="premium-note">Pagamento ainda não ativado.</small>
        </article>
      </div>

      <article class="panel premium-compare">
        <span class="eyebrow">COMPARAÇÃO</span>
        <h3>Grátis x Premium</h3>

        <div class="premium-table">
          <div><strong>Recurso</strong><strong>Grátis</strong><strong>Premium</strong></div>
          <div><span>Aulas</span><span>Selecionadas</span><strong>Todas</strong></div>
          <div><span>Questões</span><span>Limitadas</span><strong>Completas</strong></div>
          <div><span>Flashcards</span><span>Essenciais</span><strong>Todos</strong></div>
          <div><span>Treinos</span><span>Básicos</span><strong>Ilimitados</strong></div>
          <div><span>Simulados</span><span>Demonstração</span><strong>Completos</strong></div>
          <div><span>Estatísticas</span><span>Básicas</span><strong>Avançadas</strong></div>
        </div>
      </article>
    `;

    main.appendChild(section);
  }

  function addNav() {
    const nav = $(".sidebar .nav");
    if (nav && !$('[data-page="premium"]', nav)) {
      const button = document.createElement("button");
      button.className = "nav-item premium-nav";
      button.dataset.page = PAGE_ID;
      button.innerHTML = `★ <span>Planos</span><small>PREMIUM</small>`;
      nav.appendChild(button);
    }

    const sheet = $(".sheet-grid");
    if (sheet && !$('[data-sheet-page="premium"]', sheet)) {
      const button = document.createElement("button");
      button.className = "sheet-link";
      button.dataset.sheetPage = PAGE_ID;
      button.innerHTML = `<span>★</span><strong>Planos</strong><small>Grátis e Premium</small>`;
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
    if (title) title.textContent = "Planos";

    $("#sidebar")?.classList.remove("open");
    $("#mobileSheet")?.classList.remove("open");
    document.body.style.overflow = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderPremiumLessonPage(lesson) {
    const page = document.getElementById(PAGE_ID);
    if (!page) return;

    page.innerHTML = `
      <article class="panel">
        <button class="ghost-btn" id="backToPremiumPlans" type="button">
          ← Voltar para Planos
        </button>

        <span class="eyebrow">AULA PREMIUM • ACESSO PROTEGIDO</span>
        <h2>${escapeHtml(lesson.title || "Aula Premium")}</h2>

        <div class="lesson-block">
          <h3>📚 Conteúdo da aula</h3>
          <p>${escapeHtml(lesson.content || "Conteúdo Premium carregado com sucesso.")}</p>
        </div>

        <div class="lesson-block">
          <strong>🔐 Acesso autorizado</strong>
          <p class="muted">
            Esta aula foi carregada diretamente do Firestore depois que as regras
            confirmaram que sua conta possui acesso Premium.
          </p>
        </div>
      </article>
    `;

    const title = $("#pageTitle");
    if (title) title.textContent = "Aula Premium";

    $("#backToPremiumPlans")?.addEventListener("click", () => {
      page.remove();
      createPage();
      bind();
      refreshPlanStatus();
      openPremium();
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
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
  }

  async function refreshPlanStatus() {
    const firebase = await waitForFirebaseSync();
    if (!firebase) {
      renderPlan("free");
      return;
    }

    try {
      const plan = await firebase.loadUserPlan();
      renderPlan(plan);
    } catch (error) {
      console.error("Não foi possível carregar o plano:", error);
      renderPlan("free");
    }
  }

  async function openProtectedTestLesson() {
    const result = $("#premiumTestResult");
    const title = $("#premiumTestTitle");
    const content = $("#premiumTestContent");
    const status = $("#premiumTestStatus");
    const button = $("#loadPremiumTestLesson");

    if (!result || !title || !content || !status || !button) return;

    result.hidden = false;
    title.textContent = "Verificando acesso…";
    content.textContent = "";
    status.textContent = "Consultando o Firestore.";
    button.disabled = true;

    const firebase = await waitForFirebaseSync();

    if (!firebase) {
      title.textContent = "Firebase indisponível";
      status.textContent = "Não foi possível verificar o acesso agora.";
      button.disabled = false;
      return;
    }

    try {
      const user = await firebase.getCurrentFirebaseUser();

      if (!user) {
        title.textContent = "Entre com Google";
        content.textContent = "Faça login em Metas → Conta e sincronização antes de abrir conteúdo Premium.";
        status.textContent = "Acesso não solicitado sem autenticação.";
        return;
      }

      const lesson = await firebase.loadPremiumLesson(PREMIUM_TEST_LESSON_ID);

      if (!lesson) {
        title.textContent = "Aula não encontrada";
        content.textContent = "O documento Premium de teste não existe no Firestore.";
        status.textContent = "Nenhum conteúdo foi retornado.";
        return;
      }

      await refreshPlanStatus();
      renderPremiumLessonPage(lesson);
    } catch (error) {
      console.error("Acesso Premium negado ou indisponível:", error);

      const denied =
        String(error?.code || "").includes("permission-denied") ||
        String(error?.message || "").toLowerCase().includes("permission");

      title.textContent = denied
        ? "Conteúdo Premium bloqueado"
        : "Não foi possível abrir a aula";

      content.textContent = denied
        ? "Sua conta está autenticada, mas as regras do Firestore não autorizaram esta aula."
        : "Tente novamente em instantes.";

      status.textContent = denied
        ? "Acesso negado com segurança pelo Firestore."
        : "Falha ao consultar o conteúdo protegido.";
    } finally {
      button.disabled = false;
    }
  }

  function bind() {
    $('[data-page="premium"]')?.addEventListener("click", e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      openPremium();
    });

    $('[data-sheet-page="premium"]')?.addEventListener("click", e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      openPremium();
    });

    $("#premiumTopBadge")?.addEventListener("click", openPremium);

    $("#premiumInterest")?.addEventListener("click", () => {
      localStorage.setItem("pmmgPremiumInterest", "true");
      const btn = $("#premiumInterest");
      if (btn) {
        btn.textContent = "Interesse registrado ✓";
        btn.disabled = true;
      }
      alert("A assinatura ainda não está ativa. Este botão será conectado ao pagamento depois.");
    });

    $("#loadPremiumTestLesson")?.addEventListener(
      "click",
      openProtectedTestLesson
    );

    if (localStorage.getItem("pmmgPremiumInterest") === "true") {
      const btn = $("#premiumInterest");
      if (btn) {
        btn.textContent = "Interesse registrado ✓";
        btn.disabled = true;
      }
    }
  }

  async function watchPlan() {
    const firebase = await waitForFirebaseSync();
    if (!firebase) return;

    await refreshPlanStatus();

    firebase.observeFirebaseUser(() => {
      refreshPlanStatus();
    }).catch(error => {
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