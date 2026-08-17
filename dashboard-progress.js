(() => {
  "use strict";

  const STORAGE_KEY = "pmmg2027";
  const DAY_MS = 86400000;

  const SUBJECTS = [
    { name: "Português", topicCount: 7 },
    { name: "Direito Constitucional", topicCount: 7 },
    { name: "Direito Administrativo", topicCount: 7 },
    { name: "Direito Penal", topicCount: 7 },
    { name: "Processo Penal", topicCount: 6 },
    { name: "Direitos Humanos", topicCount: 5 },
    { name: "Matemática e Raciocínio Lógico", topicCount: 8 },
    { name: "Inglês", topicCount: 6 },
    { name: "Literatura", topicCount: 4 }
  ];

  const $ = (selector, root = document) => root.querySelector(selector);

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseItemDate(item) {
    const key = item?.dateKey || item?.date;
    if (!key) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return new Date(`${key}T00:00:00`);

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(key)) {
      const [day, month, year] = key.split("/").map(Number);
      return new Date(year, month - 1, day);
    }

    const parsed = new Date(key);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function startOfCurrentWeek() {
    const now = new Date();
    const day = now.getDay();
    const distanceToMonday = day === 0 ? 6 : day - 1;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  function isCurrentWeek(item) {
    const date = parseItemDate(item);
    return date ? date >= startOfCurrentWeek() : false;
  }

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      return {
        sessions: Array.isArray(data.sessions) ? data.sessions : [],
        questions: Array.isArray(data.questions) ? data.questions : [],
        completedLessons: Array.isArray(data.completedLessons) ? data.completedLessons : [],
        goals: {
          hours: Math.max(1, Number(data.goals?.hours || 18)),
          questions: Math.max(1, Number(data.goals?.questions || 250))
        }
      };
    } catch (error) {
      console.warn("Não foi possível ler o progresso para o gráfico.", error);
      return {
        sessions: [],
        questions: [],
        completedLessons: [],
        goals: { hours: 18, questions: 250 }
      };
    }
  }

  function formatMinutes(minutes) {
    const safe = Math.max(0, Number(minutes || 0));
    if (safe < 60) return `${Math.round(safe)} min`;
    return `${(safe / 60).toFixed(safe >= 600 ? 0 : 1)}h`;
  }

  function buildPanel() {
    const dashboard = $("#dashboard");
    if (!dashboard || $("#dashboardDetailedProgress")) return;

    const panel = document.createElement("article");
    panel.id = "dashboardDetailedProgress";
    panel.className = "panel dashboard-detailed-progress";
    panel.innerHTML = `
      <div class="dashboard-progress-head">
        <div>
          <span class="eyebrow">PROGRESSO DETALHADO</span>
          <h3>Evolução dos estudos</h3>
          <p class="muted">Dados reais registrados na plataforma.</p>
        </div>
        <span class="dashboard-progress-period">Últimos 7 dias</span>
      </div>

      <div class="dashboard-progress-kpis" aria-label="Resumo do progresso">
        <div class="dashboard-progress-kpi">
          <span>Estudo na semana</span>
          <strong id="dpWeeklyHours">0h</strong>
          <small id="dpWeeklyHoursGoal">meta: 18h</small>
        </div>
        <div class="dashboard-progress-kpi">
          <span>Questões na semana</span>
          <strong id="dpWeeklyQuestions">0</strong>
          <small id="dpWeeklyQuestionsGoal">meta: 250</small>
        </div>
        <div class="dashboard-progress-kpi">
          <span>Aproveitamento</span>
          <strong id="dpAccuracy">0%</strong>
          <small id="dpAccuracyDetail">0 acertos registrados</small>
        </div>
        <div class="dashboard-progress-kpi">
          <span>Aulas concluídas</span>
          <strong id="dpLessons">0/57</strong>
          <small id="dpLessonPercent">0% do conteúdo registrado</small>
        </div>
      </div>

      <div class="dashboard-progress-grid">
        <section class="dashboard-chart-card">
          <div class="dashboard-chart-title">
            <div>
              <strong>Ritmo diário</strong>
              <small>Tempo de estudo e questões por dia</small>
            </div>
            <div class="dashboard-chart-legend">
              <span><i></i> estudo</span>
              <span>● questões</span>
            </div>
          </div>
          <div class="dashboard-study-chart" id="dpActivityChart" role="img" aria-label="Gráfico de atividade dos últimos sete dias"></div>
          <p class="dashboard-chart-empty" id="dpChartEmpty" hidden>Registre uma sessão ou bloco de questões para começar a formar seu histórico.</p>
        </section>

        <section class="dashboard-chart-card dashboard-goal-card">
          <div class="dashboard-chart-title">
            <div>
              <strong>Metas da semana</strong>
              <small>Quanto falta para chegar ao objetivo</small>
            </div>
          </div>
          <div class="dashboard-goal-row">
            <div><span>Horas</span><strong id="dpHoursPercent">0%</strong></div>
            <div class="dashboard-goal-track"><i id="dpHoursBar"></i></div>
            <small id="dpHoursRemaining">18h restantes</small>
          </div>
          <div class="dashboard-goal-row">
            <div><span>Questões</span><strong id="dpQuestionsPercent">0%</strong></div>
            <div class="dashboard-goal-track"><i id="dpQuestionsBar"></i></div>
            <small id="dpQuestionsRemaining">250 restantes</small>
          </div>
          <div class="dashboard-goal-row">
            <div><span>Conteúdo</span><strong id="dpContentPercent">0%</strong></div>
            <div class="dashboard-goal-track"><i id="dpContentBar"></i></div>
            <small id="dpContentRemaining">57 aulas restantes</small>
          </div>
        </section>
      </div>

      <section class="dashboard-subject-progress">
        <div class="dashboard-chart-title">
          <div>
            <strong>Progresso por disciplina</strong>
            <small>Conteúdo concluído, tempo estudado, questões e precisão</small>
          </div>
        </div>
        <div class="dashboard-subject-progress-list" id="dpSubjectList"></div>
      </section>
    `;

    const contentGrid = $("#dashboard .content-grid");
    if (contentGrid) dashboard.insertBefore(panel, contentGrid);
    else dashboard.appendChild(panel);
  }

  function makeLastSevenDays() {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(today.getTime() - offset * DAY_MS);
      days.push({
        date,
        key: localDateKey(date),
        weekday: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        day: String(date.getDate()).padStart(2, "0")
      });
    }

    return days;
  }

  function questionStats(items) {
    const total = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const correct = items.reduce((sum, item) => sum + Number(item.correct || 0), 0);
    return {
      total,
      correct,
      accuracy: total ? Math.round((correct / total) * 100) : 0
    };
  }

  function renderActivityChart(state) {
    const chart = $("#dpActivityChart");
    const empty = $("#dpChartEmpty");
    if (!chart) return;

    const days = makeLastSevenDays();
    const activity = days.map(day => {
      const sessions = state.sessions.filter(item => {
        const date = parseItemDate(item);
        return date && localDateKey(date) === day.key;
      });
      const questions = state.questions.filter(item => {
        const date = parseItemDate(item);
        return date && localDateKey(date) === day.key;
      });
      return {
        ...day,
        minutes: sessions.reduce((sum, item) => sum + Number(item.minutes || 0), 0),
        questions: questionStats(questions).total
      };
    });

    const maxMinutes = Math.max(30, ...activity.map(item => item.minutes));
    const hasActivity = activity.some(item => item.minutes > 0 || item.questions > 0);

    chart.innerHTML = activity.map(item => {
      const height = item.minutes ? Math.max(8, Math.round((item.minutes / maxMinutes) * 100)) : 2;
      const title = `${item.weekday}, ${item.day}: ${formatMinutes(item.minutes)} de estudo e ${item.questions} questões`;
      return `
        <div class="dashboard-study-day" title="${title}" aria-label="${title}">
          <div class="dashboard-question-count" data-has-questions="${item.questions > 0}">${item.questions || "·"}</div>
          <div class="dashboard-study-bar-zone">
            <div class="dashboard-study-bar" style="height:${height}%"></div>
          </div>
          <strong>${item.weekday}</strong>
          <small>${item.day}</small>
        </div>
      `;
    }).join("");

    if (empty) empty.hidden = hasActivity;
  }

  function renderSubjects(state) {
    const list = $("#dpSubjectList");
    if (!list) return;

    list.innerHTML = SUBJECTS.map(subject => {
      const sessions = state.sessions.filter(item => item.subject === subject.name);
      const minutes = sessions.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
      const questions = state.questions.filter(item => item.subject === subject.name);
      const stats = questionStats(questions);
      const completed = state.completedLessons.filter(id => String(id).startsWith(`${subject.name}::`)).length;
      const lessonPercent = Math.min(100, Math.round((completed / subject.topicCount) * 100));

      return `
        <div class="dashboard-subject-row">
          <div class="dashboard-subject-main">
            <div class="dashboard-subject-name">
              <strong>${subject.name}</strong>
              <span>${completed}/${subject.topicCount} aulas • ${lessonPercent}%</span>
            </div>
            <div class="dashboard-subject-track"><i style="width:${lessonPercent}%"></i></div>
          </div>
          <div class="dashboard-subject-metrics">
            <span><b>${formatMinutes(minutes)}</b><small>estudo</small></span>
            <span><b>${stats.total}</b><small>questões</small></span>
            <span><b>${stats.accuracy}%</b><small>acertos</small></span>
          </div>
        </div>
      `;
    }).join("");
  }

  function render() {
    buildPanel();
    if (!$("#dashboardDetailedProgress")) return;

    const state = readState();
    const weeklySessions = state.sessions.filter(isCurrentWeek);
    const weeklyMinutes = weeklySessions.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
    const weeklyQuestions = questionStats(state.questions.filter(isCurrentWeek));
    const allQuestions = questionStats(state.questions);
    const totalTopics = SUBJECTS.reduce((sum, subject) => sum + subject.topicCount, 0);
    const completedLessons = new Set(state.completedLessons).size;
    const contentPercent = Math.min(100, Math.round((completedLessons / totalTopics) * 100));

    const hoursPercent = Math.min(100, Math.round((weeklyMinutes / 60 / state.goals.hours) * 100));
    const questionsPercent = Math.min(100, Math.round((weeklyQuestions.total / state.goals.questions) * 100));

    $("#dpWeeklyHours").textContent = formatMinutes(weeklyMinutes);
    $("#dpWeeklyHoursGoal").textContent = `meta: ${state.goals.hours}h`;
    $("#dpWeeklyQuestions").textContent = String(weeklyQuestions.total);
    $("#dpWeeklyQuestionsGoal").textContent = `meta: ${state.goals.questions}`;
    $("#dpAccuracy").textContent = `${allQuestions.accuracy}%`;
    $("#dpAccuracyDetail").textContent = `${allQuestions.correct} acertos em ${allQuestions.total} questões`;
    $("#dpLessons").textContent = `${completedLessons}/${totalTopics}`;
    $("#dpLessonPercent").textContent = `${contentPercent}% do conteúdo registrado`;

    $("#dpHoursPercent").textContent = `${hoursPercent}%`;
    $("#dpHoursBar").style.width = `${hoursPercent}%`;
    $("#dpHoursRemaining").textContent = `${Math.max(0, state.goals.hours - weeklyMinutes / 60).toFixed(1)}h restantes`;

    $("#dpQuestionsPercent").textContent = `${questionsPercent}%`;
    $("#dpQuestionsBar").style.width = `${questionsPercent}%`;
    $("#dpQuestionsRemaining").textContent = `${Math.max(0, state.goals.questions - weeklyQuestions.total)} restantes`;

    $("#dpContentPercent").textContent = `${contentPercent}%`;
    $("#dpContentBar").style.width = `${contentPercent}%`;
    $("#dpContentRemaining").textContent = `${Math.max(0, totalTopics - completedLessons)} aulas restantes`;

    renderActivityChart(state);
    renderSubjects(state);
  }

  function watchDashboardMetrics() {
    const targets = ["#hoursStat", "#questionsStat", "#accuracyStat", "#weeklyProgressText"]
      .map(selector => $(selector))
      .filter(Boolean);

    if (!targets.length) return;

    let timer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(render, 60);
    });

    targets.forEach(target => observer.observe(target, { childList: true, subtree: true, characterData: true }));
  }

  function init() {
    buildPanel();
    render();
    watchDashboardMetrics();
    window.addEventListener("storage", event => {
      if (event.key === STORAGE_KEY) render();
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) render();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();