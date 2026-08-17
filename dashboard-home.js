(() => {
  "use strict";

  const STORAGE_KEY = "pmmg2027";
  const LAST_LESSON_KEY = "pmmgLastPremiumLesson";
  const $ = (selector, root = document) => root.querySelector(selector);

  const escapeHtml = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function ensureStyles() {
    if ($('link[data-dashboard-home-styles]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "dashboard-home.css?v=1";
    link.dataset.dashboardHomeStyles = "true";
    document.head.appendChild(link);
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function readState() {
    const raw = readJson(STORAGE_KEY, {});
    return {
      sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
      questions: Array.isArray(raw.questions) ? raw.questions : [],
      completedLessons: Array.isArray(raw.completedLessons) ? raw.completedLessons : [],
      goals: {
        hours: Math.max(1, Number(raw.goals?.hours || 18)),
        questions: Math.max(1, Number(raw.goals?.questions || 250))
      }
    };
  }

  function lastLesson() {
    const lesson = readJson(LAST_LESSON_KEY, null);
    return lesson && typeof lesson === "object" ? lesson : null;
  }

  function openPremium(mode) {
    const selector = `[data-premium-sidebar="${mode}"]`;
    let attempt = 0;
    const tryOpen = () => {
      const button = $(selector) || $(`[data-premium-sheet="${mode}"]`);
      if (button) {
        button.click();
        return;
      }
      attempt += 1;
      if (attempt < 12) setTimeout(tryOpen, 100);
    };
    tryOpen();
  }

  function goPage(page) {
    const button = $(`[data-page="${page}"]`) || $(`[data-mobile-page="${page}"]`);
    button?.click();
  }

  function getContinueInfo(state) {
    const savedLesson = lastLesson();
    if (savedLesson?.title) {
      return {
        kicker: "CONTINUAR DE ONDE PAROU",
        title: savedLesson.title,
        detail: [savedLesson.subject, savedLesson.module].filter(Boolean).join(" • ") || "Aula Premium",
        button: "Continuar aula"
      };
    }

    const session = state.sessions[state.sessions.length - 1];
    if (session?.subject) {
      return {
        kicker: "CONTINUAR SUA PREPARAÇÃO",
        title: session.topic && session.topic !== "Estudo geral" ? session.topic : session.subject,
        detail: session.topic && session.topic !== session.subject ? session.subject : "Retome a matéria e avance para o próximo tópico.",
        button: "Abrir área Estudar"
      };
    }

    return {
      kicker: "COMECE PELO CONTEÚDO",
      title: "Escolha uma matéria e aprenda o conteúdo passo a passo.",
      detail: "Teoria completa, exemplos, pontos de atenção e base legal quando aplicável.",
      button: "Abrir área Estudar"
    };
  }

  function getWeakness(state) {
    const bySubject = new Map();
    state.questions.forEach(item => {
      const subject = String(item?.subject || "").trim();
      if (!subject) return;
      const total = Math.max(0, Number(item.total || 0));
      const correct = Math.max(0, Number(item.correct || 0));
      if (!bySubject.has(subject)) bySubject.set(subject, { total: 0, correct: 0 });
      const stats = bySubject.get(subject);
      stats.total += total;
      stats.correct += Math.min(correct, total);
    });

    const candidates = [...bySubject.entries()]
      .filter(([, stats]) => stats.total >= 5)
      .map(([subject, stats]) => ({
        subject,
        total: stats.total,
        accuracy: Math.round((stats.correct / stats.total) * 100)
      }))
      .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);

    if (candidates.length) {
      const weakest = candidates[0];
      return {
        icon: "🎯",
        eyebrow: "PONTO DE ATENÇÃO",
        title: `Reforce ${weakest.subject}`,
        detail: `Seu aproveitamento registrado é de ${weakest.accuracy}% em ${weakest.total} questões. Use o banco Premium para atacar esse ponto fraco.`,
        action: "practice",
        button: "Praticar esta matéria"
      };
    }

    const savedLesson = lastLesson();
    if (savedLesson?.subject) {
      return {
        icon: "📚",
        eyebrow: "PRÓXIMO PASSO",
        title: `Continue ${savedLesson.subject}`,
        detail: "Retome a teoria antes de aumentar o volume de questões. O objetivo é entender o assunto e depois testar a retenção.",
        action: "study",
        button: "Continuar estudando"
      };
    }

    return {
      icon: "🧭",
      eyebrow: "O QUE ESTUDAR AGORA",
      title: "Construa uma base antes de acelerar nas questões",
      detail: "Abra uma aula completa, entenda o conteúdo e só depois use Praticar e Simulados para medir o domínio.",
      action: "study",
      button: "Escolher uma aula"
    };
  }

  function weeklyMinutes(state) {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);

    return state.sessions.reduce((sum, item) => {
      const raw = item?.dateKey || item?.date;
      if (!raw) return sum;
      let date = null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) date = new Date(`${raw}T00:00:00`);
      else if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
        const [d, m, y] = raw.split("/").map(Number);
        date = new Date(y, m - 1, d);
      }
      return date && date >= monday ? sum + Number(item.minutes || 0) : sum;
    }, 0);
  }

  function buildHome() {
    const dashboard = $("#dashboard");
    if (!dashboard) return null;
    dashboard.classList.add("dashboard-course-first");

    let home = $("#dashboardCourseHome", dashboard);
    if (!home) {
      home = document.createElement("div");
      home.id = "dashboardCourseHome";
      home.className = "dashboard-course-home";
      dashboard.prepend(home);
    }

    return home;
  }

  function buildTools() {
    const dashboard = $("#dashboard");
    if (!dashboard) return null;
    let tools = $("#dashboardSupportTools", dashboard);
    if (tools) return tools;

    tools = document.createElement("section");
    tools.id = "dashboardSupportTools";
    tools.className = "panel dashboard-support-tools";
    tools.innerHTML = `
      <div class="dashboard-support-head">
        <div>
          <span class="eyebrow">FERRAMENTAS DE APOIO</span>
          <h3>Use quando precisar organizar sua rotina</h3>
          <p class="muted">O cronômetro continua disponível, mas agora é uma ferramenta — não o ponto de partida do curso.</p>
        </div>
      </div>
      <div class="dashboard-support-grid">
        <button type="button" data-dashboard-page="sessao"><span>◷</span><strong>Sessão focada</strong><small>Cronômetro e registro de estudo</small></button>
        <button type="button" data-dashboard-page="metas"><span>◎</span><strong>Metas</strong><small>Ajuste horas e objetivos semanais</small></button>
        <button type="button" data-dashboard-page="revisoes"><span>↻</span><strong>Revisões</strong><small>Organize 24h, 7d e 30d</small></button>
      </div>
    `;

    tools.querySelectorAll("[data-dashboard-page]").forEach(button => {
      button.addEventListener("click", () => goPage(button.dataset.dashboardPage));
    });
    dashboard.appendChild(tools);
    return tools;
  }

  function renderHome() {
    const home = buildHome();
    if (!home) return;

    const state = readState();
    const continueInfo = getContinueInfo(state);
    const weakness = getWeakness(state);
    const minutes = weeklyMinutes(state);
    const weeklyPercent = Math.min(100, Math.round((minutes / 60 / state.goals.hours) * 100));

    home.innerHTML = `
      <section class="dashboard-course-hero">
        <div class="dashboard-course-copy">
          <span class="dashboard-course-badge">ROTA PMMG 2027</span>
          <h2>Sua preparação completa para a PMMG.</h2>
          <p>Aprenda a teoria com profundidade, pratique até dominar e teste seu desempenho em simulados.</p>
          <div class="dashboard-course-week">
            <span>Meta semanal</span>
            <strong>${weeklyPercent}%</strong>
            <div><i style="width:${weeklyPercent}%"></i></div>
            <small>${(minutes / 60).toFixed(1)}h de ${state.goals.hours}h registradas</small>
          </div>
        </div>

        <article class="dashboard-continue-card">
          <span class="eyebrow">${escapeHtml(continueInfo.kicker)}</span>
          <h3>${escapeHtml(continueInfo.title)}</h3>
          <p>${escapeHtml(continueInfo.detail)}</p>
          <button class="primary-btn" id="dashboardContinueStudy" type="button">📚 ${escapeHtml(continueInfo.button)}</button>
        </article>
      </section>

      <section class="dashboard-course-actions" aria-label="Recursos principais de estudo">
        <button type="button" data-dashboard-premium="study">
          <span class="dashboard-course-action-icon">📚</span>
          <span><strong>Estudar</strong><small>Teoria completa e videoaulas</small></span>
          <b>›</b>
        </button>
        <button type="button" data-dashboard-premium="practice">
          <span class="dashboard-course-action-icon">✍️</span>
          <span><strong>Praticar questões</strong><small>Treine por disciplina</small></span>
          <b>›</b>
        </button>
        <button type="button" data-dashboard-premium="simulation">
          <span class="dashboard-course-action-icon">🎯</span>
          <span><strong>Simulados</strong><small>Treino de prova com cronômetro</small></span>
          <b>›</b>
        </button>
      </section>

      <article class="dashboard-next-step">
        <span class="dashboard-next-icon">${weakness.icon}</span>
        <div>
          <span class="eyebrow">${escapeHtml(weakness.eyebrow)}</span>
          <h3>${escapeHtml(weakness.title)}</h3>
          <p>${escapeHtml(weakness.detail)}</p>
        </div>
        <button class="ghost-btn" id="dashboardWeaknessAction" type="button">${escapeHtml(weakness.button)} →</button>
      </article>
    `;

    $("#dashboardContinueStudy", home)?.addEventListener("click", () => openPremium("study"));
    $("#dashboardWeaknessAction", home)?.addEventListener("click", () => openPremium(weakness.action));
    home.querySelectorAll("[data-dashboard-premium]").forEach(button => {
      button.addEventListener("click", () => openPremium(button.dataset.dashboardPremium));
    });

    organizeDashboard();
  }

  function organizeDashboard() {
    const dashboard = $("#dashboard");
    const home = $("#dashboardCourseHome", dashboard);
    if (!dashboard || !home) return;

    const oldHero = dashboard.querySelector(":scope > .hero");
    const oldWelcome = dashboard.querySelector(":scope > .dashboard-welcome");
    const oldStats = dashboard.querySelector(":scope > .stats-grid");
    [oldHero, oldWelcome, oldStats].filter(Boolean).forEach(item => item.hidden = true);

    const progress = $("#dashboardDetailedProgress", dashboard);
    const contentGrid = dashboard.querySelector(":scope > .content-grid");
    const highlights = dashboard.querySelector(":scope > .dashboard-highlights");
    const tools = buildTools();

    let anchor = home;
    if (progress) {
      anchor.after(progress);
      anchor = progress;
    }
    if (contentGrid) {
      anchor.after(contentGrid);
      anchor = contentGrid;
    }
    if (highlights) {
      anchor.after(highlights);
      anchor = highlights;
    }
    if (tools) anchor.after(tools);
  }

  function rememberOpenedLesson(event) {
    const button = event.target.closest?.("[data-premium-lesson]");
    if (!button) return;

    const title = button.querySelector("strong")?.textContent?.trim() || "Aula Premium";
    const subject = button.closest(".premium-subject-card")?.querySelector(".premium-subject-head h3")?.textContent?.trim() || "";
    const module = button.closest(".premium-library-module")?.querySelector("h4")?.textContent?.trim() || "";

    localStorage.setItem(LAST_LESSON_KEY, JSON.stringify({
      id: button.dataset.premiumLesson || "",
      title,
      subject,
      module,
      openedAt: Date.now()
    }));
  }

  function init() {
    ensureStyles();
    document.addEventListener("click", rememberOpenedLesson, true);
    renderHome();

    const dashboard = $("#dashboard");
    if (dashboard) {
      let timer = null;
      const observer = new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(organizeDashboard, 50);
      });
      observer.observe(dashboard, { childList: true });
    }

    window.addEventListener("storage", event => {
      if (!event.key || event.key === STORAGE_KEY || event.key === LAST_LESSON_KEY) renderHome();
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) renderHome();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
