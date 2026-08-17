(() => {
  "use strict";

  const HISTORY_KEY = "pmmgPremiumSimulations";
  const APP_STORAGE_KEY = "pmmg2027";
  const QUESTIONS_PER_MINUTE = 2 / 3; // 90 segundos por questão
  const $ = (selector, root = document) => root.querySelector(selector);

  let activeExam = null;

  const escapeHtml = value =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const optionText = option =>
    typeof option === "string" ? option : String(option?.text ?? "");

  const optionId = (option, index) =>
    typeof option === "object" && option?.id
      ? String(option.id)
      : String.fromCharCode(65 + index);

  function ensureStyles() {
    if ($('link[data-premium-simulation-styles]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "premium-simulations.css?v=1";
    link.dataset.premiumSimulationStyles = "true";
    document.head.appendChild(link);
  }

  async function waitForHost() {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const host = $("#premiumSimulationSection");
      if (host && window.firebaseSync) return host;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return null;
  }

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
    }
    return copy;
  }

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDuration(seconds) {
    const safe = Math.max(0, Math.floor(Number(seconds || 0)));
    const minutes = Math.floor(safe / 60);
    const rest = safe % 60;
    return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }

  function readHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn("Não foi possível ler o histórico de simulados.", error);
      return [];
    }
  }

  function saveHistory(entry) {
    const history = readHistory();
    history.unshift(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
  }

  function recordProgress(entry) {
    try {
      const raw = localStorage.getItem(APP_STORAGE_KEY);
      const state = raw ? JSON.parse(raw) : {};
      const questions = Array.isArray(state.questions) ? state.questions : [];

      Object.entries(entry.breakdown || {}).forEach(([subject, stats]) => {
        questions.push({
          subject,
          topic: "Simulado Premium",
          total: Number(stats.total || 0),
          correct: Number(stats.correct || 0),
          percentage: Number(stats.percentage || 0),
          date: new Date(entry.finishedAt).toLocaleDateString("pt-BR"),
          dateKey: localDateKey(new Date(entry.finishedAt)),
          source: "premium-simulation",
          simulationId: entry.id
        });
      });

      state.questions = questions;
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));

      try {
        window.dispatchEvent(new StorageEvent("storage", {
          key: APP_STORAGE_KEY,
          newValue: JSON.stringify(state)
        }));
      } catch {
        window.dispatchEvent(new Event("storage"));
      }
    } catch (error) {
      console.warn("Não foi possível registrar o resultado do simulado no progresso.", error);
    }
  }

  function renderLocked(host, message) {
    stopTimer();
    host.innerHTML = `
      <div class="premium-empty-state">
        <span class="premium-empty-icon">🔒</span>
        <h3>Simulados Premium</h3>
        <p class="muted">${escapeHtml(message)}</p>
      </div>
    `;
  }

  function uniqueSubjects(lessons) {
    return [...new Set(
      lessons
        .filter(lesson => lesson.active !== false)
        .map(lesson => String(lesson.subject || "").trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }

  function renderHistory() {
    const history = readHistory().slice(0, 5);
    if (!history.length) {
      return `
        <section class="premium-simulation-history">
          <span class="eyebrow">HISTÓRICO</span>
          <h3>Seus últimos simulados</h3>
          <p class="muted">Você ainda não concluiu nenhum simulado Premium neste aparelho.</p>
        </section>
      `;
    }

    return `
      <section class="premium-simulation-history">
        <span class="eyebrow">HISTÓRICO</span>
        <h3>Seus últimos simulados</h3>
        <div class="premium-simulation-history-list">
          ${history.map(item => `
            <div class="premium-simulation-history-item">
              <strong>${escapeHtml(item.label || "Simulado Premium")}</strong>
              <small>${escapeHtml(new Date(item.finishedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }))} • ${Number(item.correct || 0)}/${Number(item.total || 0)} acertos</small>
              <span class="premium-simulation-history-score">${Number(item.percentage || 0)}%</span>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderSetup(host, subjects) {
    stopTimer();
    activeExam = null;

    host.innerHTML = `
      <div class="premium-simulation-shell">
        <section class="premium-simulation-setup">
          <span class="eyebrow">SIMULADOS PREMIUM</span>
          <h3>Monte seu treino de prova</h3>
          <p class="muted">Escolha uma disciplina ou faça um simulado geral. As questões são sorteadas do banco Premium e o gabarito só aparece depois da finalização.</p>

          <div class="premium-simulation-form">
            <div class="premium-simulation-field">
              <label for="premiumSimulationSubject">Tipo de simulado</label>
              <select id="premiumSimulationSubject">
                <option value="__ALL__">Geral — várias disciplinas</option>
                ${subjects.map(subject => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`).join("")}
              </select>
            </div>

            <div class="premium-simulation-field">
              <label for="premiumSimulationCount">Quantidade de questões</label>
              <select id="premiumSimulationCount">
                <option value="10">10 questões</option>
                <option value="20" selected>20 questões</option>
                <option value="30">30 questões</option>
                <option value="40">40 questões</option>
                <option value="50">50 questões</option>
              </select>
            </div>

            <button class="primary-btn premium-simulation-start" id="premiumSimulationStart" type="button">Iniciar simulado</button>
          </div>

          <div class="premium-simulation-note">
            <span>⏱️ 1min30 por questão</span>
            <span>🎯 Gabarito após finalizar</span>
            <span>📊 Resultado por disciplina</span>
            <span>📈 Conta no seu progresso</span>
          </div>
        </section>

        ${renderHistory()}
      </div>
    `;

    $("#premiumSimulationStart", host)?.addEventListener("click", () => {
      const subject = $("#premiumSimulationSubject", host)?.value || "__ALL__";
      const count = Math.max(1, Number($("#premiumSimulationCount", host)?.value || 20));
      void startSimulation(host, subjects, subject, count);
    });
  }

  function balancedSample(groups, count) {
    const shuffledGroups = groups
      .map(group => ({ subject: group.subject, items: shuffle(group.items) }))
      .filter(group => group.items.length);

    const chosen = [];
    let cursor = 0;

    while (chosen.length < count && shuffledGroups.some(group => group.items.length)) {
      const group = shuffledGroups[cursor % shuffledGroups.length];
      const question = group.items.shift();
      if (question) chosen.push(question);
      cursor += 1;
    }

    return shuffle(chosen);
  }

  async function loadQuestionPool(subjects, selectedSubject, count) {
    if (selectedSubject !== "__ALL__") {
      const questions = await window.firebaseSync.loadPremiumQuestionsBySubject(selectedSubject);
      return shuffle(questions).slice(0, Math.min(count, questions.length));
    }

    const groups = await Promise.all(subjects.map(async subject => ({
      subject,
      items: await window.firebaseSync.loadPremiumQuestionsBySubject(subject)
    })));

    return balancedSample(groups, count);
  }

  async function startSimulation(host, subjects, selectedSubject, requestedCount) {
    stopTimer();
    host.innerHTML = `
      <div class="premium-empty-state">
        <span class="premium-empty-icon">🎯</span>
        <h3>Montando seu simulado…</h3>
        <p class="muted">Sorteando questões do banco Premium e preparando o cronômetro.</p>
      </div>
    `;

    try {
      const questions = await loadQuestionPool(subjects, selectedSubject, requestedCount);
      if (!questions.length) {
        host.innerHTML = `
          <div class="premium-empty-state">
            <span class="premium-empty-icon">🎯</span>
            <h3>Banco insuficiente</h3>
            <p class="muted">Não encontramos questões disponíveis para montar este simulado.</p>
            <button class="ghost-btn" id="premiumSimulationBack" type="button">← Voltar</button>
          </div>
        `;
        $("#premiumSimulationBack", host)?.addEventListener("click", () => renderSetup(host, subjects));
        return;
      }

      const durationSeconds = Math.max(60, Math.round(questions.length / QUESTIONS_PER_MINUTE * 60));
      activeExam = {
        questions,
        answers: new Map(),
        currentIndex: 0,
        startedAt: Date.now(),
        durationSeconds,
        remainingSeconds: durationSeconds,
        timerId: null,
        selectedSubject,
        subjects,
        finished: false
      };

      renderExam(host);
      startTimer(host);
    } catch (error) {
      console.error("Não foi possível montar o simulado Premium:", error);
      const denied = String(error?.code || "").includes("permission-denied");
      renderLocked(host, denied
        ? "O Firestore bloqueou o acesso às questões para esta conta."
        : "Não foi possível montar o simulado agora.");
    }
  }

  function renderExam(host) {
    const exam = activeExam;
    if (!exam || exam.finished) return;

    const question = exam.questions[exam.currentIndex];
    const options = Array.isArray(question.options) ? question.options : [];
    const selected = exam.answers.get(question.id);
    const answered = exam.answers.size;
    const total = exam.questions.length;
    const progress = Math.round(((exam.currentIndex + 1) / total) * 100);
    const context = [question.subject, question.module, question.lessonTitle].filter(Boolean).join(" • ");

    host.innerHTML = `
      <section class="premium-simulation-exam">
        <div class="premium-simulation-topbar">
          <div>
            <strong>${exam.selectedSubject === "__ALL__" ? "Simulado Geral Premium" : escapeHtml(exam.selectedSubject)}</strong>
            <div class="premium-simulation-progress-text">Questão ${exam.currentIndex + 1} de ${total} • ${answered} respondida${answered === 1 ? "" : "s"}</div>
          </div>
          <span class="premium-simulation-progress-text">${progress}% percorrido</span>
          <div class="premium-simulation-timer" id="premiumSimulationTimer">${formatDuration(exam.remainingSeconds)}</div>
        </div>

        <div class="premium-simulation-progress-track"><i style="width:${progress}%"></i></div>

        <div class="premium-simulation-layout">
          <article class="premium-simulation-question">
            ${context ? `<small class="premium-simulation-question-context">${escapeHtml(context)}</small>` : ""}
            <h4>${exam.currentIndex + 1}. ${escapeHtml(question.question)}</h4>

            <div class="premium-simulation-options">
              ${options.map((option, index) => {
                const id = optionId(option, index);
                return `
                  <button class="premium-simulation-option${selected === id ? " selected" : ""}" type="button" data-simulation-option="${escapeHtml(id)}">
                    <strong>${escapeHtml(id)}.</strong>
                    <span>${escapeHtml(optionText(option))}</span>
                  </button>
                `;
              }).join("")}
            </div>
          </article>

          <aside class="premium-simulation-side">
            <div class="premium-simulation-side-card">
              <strong>Mapa da prova</strong>
              <div class="premium-simulation-map">
                ${exam.questions.map((item, index) => `
                  <button
                    class="${exam.answers.has(item.id) ? "answered " : ""}${index === exam.currentIndex ? "current" : ""}"
                    type="button"
                    data-simulation-jump="${index}"
                    aria-label="Ir para questão ${index + 1}"
                  >${index + 1}</button>
                `).join("")}
              </div>
            </div>

            <div class="premium-simulation-side-card premium-simulation-actions">
              <button class="ghost-btn" id="premiumSimulationPrev" type="button" ${exam.currentIndex === 0 ? "disabled" : ""}>← Anterior</button>
              <button class="ghost-btn" id="premiumSimulationNext" type="button" ${exam.currentIndex === total - 1 ? "disabled" : ""}>Próxima →</button>
              <button class="primary-btn premium-simulation-finish" id="premiumSimulationFinish" type="button">Finalizar simulado</button>
            </div>
          </aside>
        </div>
      </section>
    `;

    host.querySelectorAll("[data-simulation-option]").forEach(button => {
      button.addEventListener("click", () => {
        exam.answers.set(question.id, button.dataset.simulationOption);
        renderExam(host);
      });
    });

    host.querySelectorAll("[data-simulation-jump]").forEach(button => {
      button.addEventListener("click", () => {
        exam.currentIndex = Number(button.dataset.simulationJump || 0);
        renderExam(host);
      });
    });

    $("#premiumSimulationPrev", host)?.addEventListener("click", () => {
      exam.currentIndex = Math.max(0, exam.currentIndex - 1);
      renderExam(host);
    });

    $("#premiumSimulationNext", host)?.addEventListener("click", () => {
      exam.currentIndex = Math.min(total - 1, exam.currentIndex + 1);
      renderExam(host);
    });

    $("#premiumSimulationFinish", host)?.addEventListener("click", () => finishSimulation(host, false));

    updateTimerElement(host);
  }

  function startTimer(host) {
    const exam = activeExam;
    if (!exam || exam.finished) return;
    stopTimer(false);

    exam.timerId = window.setInterval(() => {
      if (!activeExam || activeExam.finished) {
        stopTimer();
        return;
      }

      activeExam.remainingSeconds = Math.max(0, activeExam.remainingSeconds - 1);
      updateTimerElement(host);

      if (activeExam.remainingSeconds === 0) {
        finishSimulation(host, true);
      }
    }, 1000);
  }

  function stopTimer(clearExamTimer = true) {
    const timerId = activeExam?.timerId;
    if (timerId) window.clearInterval(timerId);
    if (activeExam && clearExamTimer) activeExam.timerId = null;
  }

  function updateTimerElement(host) {
    const timer = $("#premiumSimulationTimer", host);
    const exam = activeExam;
    if (!timer || !exam) return;
    timer.textContent = formatDuration(exam.remainingSeconds);
    timer.classList.toggle("urgent", exam.remainingSeconds <= 300);
  }

  function calculateResult(exam) {
    let correct = 0;
    const breakdown = {};

    exam.questions.forEach(question => {
      const subject = String(question.subject || "Geral").trim() || "Geral";
      if (!breakdown[subject]) breakdown[subject] = { total: 0, correct: 0, percentage: 0 };
      breakdown[subject].total += 1;

      const selected = exam.answers.get(question.id);
      const isCorrect = selected === String(question.correctOptionId ?? "");
      if (isCorrect) {
        correct += 1;
        breakdown[subject].correct += 1;
      }
    });

    Object.values(breakdown).forEach(stats => {
      stats.percentage = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
    });

    return {
      correct,
      total: exam.questions.length,
      percentage: exam.questions.length ? Math.round((correct / exam.questions.length) * 100) : 0,
      answered: exam.answers.size,
      breakdown
    };
  }

  function finishSimulation(host, automatic) {
    const exam = activeExam;
    if (!exam || exam.finished) return;

    const unanswered = exam.questions.length - exam.answers.size;
    if (!automatic && unanswered > 0) {
      const ok = window.confirm(`Ainda existem ${unanswered} questão${unanswered === 1 ? "" : "ões"} sem resposta. Deseja finalizar mesmo assim?`);
      if (!ok) return;
    }

    exam.finished = true;
    stopTimer();

    const result = calculateResult(exam);
    const finishedAt = Date.now();
    const elapsedSeconds = Math.max(0, Math.min(exam.durationSeconds, Math.floor((finishedAt - exam.startedAt) / 1000)));
    const label = exam.selectedSubject === "__ALL__" ? "Simulado Geral Premium" : `Simulado — ${exam.selectedSubject}`;
    const entry = {
      id: `sim-${finishedAt}-${Math.random().toString(36).slice(2, 7)}`,
      label,
      subject: exam.selectedSubject,
      total: result.total,
      correct: result.correct,
      percentage: result.percentage,
      answered: result.answered,
      elapsedSeconds,
      finishedAt,
      breakdown: result.breakdown
    };

    saveHistory(entry);
    recordProgress(entry);
    renderResult(host, exam, result, entry, automatic);
  }

  function renderResult(host, exam, result, entry, automatic) {
    const breakdownRows = Object.entries(result.breakdown)
      .sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))
      .map(([subject, stats]) => `
        <div class="premium-simulation-breakdown-row">
          <div>
            <strong>${escapeHtml(subject)}</strong>
            <small>${stats.correct}/${stats.total} acertos</small>
          </div>
          <strong>${stats.percentage}%</strong>
        </div>
      `).join("");

    host.innerHTML = `
      <section class="premium-simulation-result">
        <div class="premium-simulation-result-head">
          <div>
            <span class="eyebrow">RESULTADO DO SIMULADO</span>
            <h3>${escapeHtml(entry.label)}</h3>
            <p class="muted">${automatic ? "O tempo terminou e a prova foi finalizada automaticamente." : "Prova finalizada. O gabarito comentado agora está liberado."}</p>
          </div>
          <div class="premium-simulation-result-score">
            <strong>${result.percentage}%</strong>
            <span>APROVEITAMENTO</span>
          </div>
        </div>

        <div class="premium-simulation-result-kpis">
          <div class="premium-simulation-result-kpi"><span>Acertos</span><strong>${result.correct}/${result.total}</strong></div>
          <div class="premium-simulation-result-kpi"><span>Respondidas</span><strong>${result.answered}/${result.total}</strong></div>
          <div class="premium-simulation-result-kpi"><span>Tempo usado</span><strong>${formatDuration(entry.elapsedSeconds)}</strong></div>
        </div>

        <div class="premium-simulation-breakdown">
          <span class="eyebrow">DESEMPENHO POR DISCIPLINA</span>
          ${breakdownRows}
        </div>

        <div class="premium-simulation-review">
          <span class="eyebrow">GABARITO COMENTADO</span>
          ${exam.questions.map((question, index) => {
            const selected = exam.answers.get(question.id);
            const correct = String(question.correctOptionId ?? "");
            const isCorrect = selected === correct;
            const options = Array.isArray(question.options) ? question.options : [];
            const correctOption = options.find((option, optionIndex) => optionId(option, optionIndex) === correct);
            const selectedOption = options.find((option, optionIndex) => optionId(option, optionIndex) === selected);
            return `
              <details>
                <summary>
                  <span>${index + 1}. ${escapeHtml(question.subject || "Questão")}</span>
                  <span class="${isCorrect ? "correct" : "wrong"}">${isCorrect ? "✓ correta" : "✕ revisar"}</span>
                </summary>
                <div class="premium-simulation-review-body">
                  <p><strong>${escapeHtml(question.question)}</strong></p>
                  <p class="${isCorrect ? "correct" : "wrong"}"><strong>Sua resposta:</strong> ${selected ? `${escapeHtml(selected)} — ${escapeHtml(optionText(selectedOption))}` : "não respondida"}</p>
                  <p class="correct"><strong>Resposta correta:</strong> ${escapeHtml(correct)} — ${escapeHtml(optionText(correctOption))}</p>
                  ${question.explanation ? `<p><strong>Comentário:</strong> ${escapeHtml(question.explanation)}</p>` : ""}
                </div>
              </details>
            `;
          }).join("")}
        </div>

        <div class="premium-simulation-review-actions">
          <button class="primary-btn" id="premiumSimulationNew" type="button">Novo simulado</button>
          <button class="ghost-btn" id="premiumSimulationRetry" type="button">Refazer com novas questões</button>
        </div>
      </section>
    `;

    $("#premiumSimulationNew", host)?.addEventListener("click", () => renderSetup(host, exam.subjects));
    $("#premiumSimulationRetry", host)?.addEventListener("click", () => {
      void startSimulation(host, exam.subjects, exam.selectedSubject, exam.questions.length);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function mountSimulation() {
    const host = await waitForHost();
    if (!host) return;

    if (activeExam && !activeExam.finished) {
      renderExam(host);
      return;
    }

    host.innerHTML = `
      <div class="premium-empty-state">
        <span class="premium-empty-icon">🎯</span>
        <h3>Carregando central de simulados…</h3>
        <p class="muted">Verificando seu plano e preparando as disciplinas disponíveis.</p>
      </div>
    `;

    try {
      const user = await window.firebaseSync.getCurrentFirebaseUser();
      if (!user) {
        renderLocked(host, "Entre com Google para acessar os simulados Premium.");
        return;
      }

      const plan = await window.firebaseSync.loadUserPlan();
      if (plan !== "premium") {
        renderLocked(host, "Sua conta está no plano Grátis. Os simulados completos permanecem bloqueados.");
        return;
      }

      const lessons = await window.firebaseSync.loadPremiumLessons();
      const subjects = uniqueSubjects(lessons);
      renderSetup(host, subjects);
    } catch (error) {
      console.error("Não foi possível abrir a central de simulados:", error);
      const denied = String(error?.code || "").includes("permission-denied");
      renderLocked(host, denied
        ? "O Firestore bloqueou o acesso à área Premium para esta conta."
        : "Não foi possível abrir os simulados agora.");
    }
  }

  async function init() {
    ensureStyles();

    document.addEventListener("pmmg:premium-mode", event => {
      if (event.detail?.mode === "simulation") void mountSimulation();
    });

    if (window.firebaseSync?.observeFirebaseUser) {
      window.firebaseSync.observeFirebaseUser(() => {
        if (activeExam && !activeExam.finished) {
          stopTimer();
          activeExam = null;
        }
        setTimeout(() => void mountSimulation(), 0);
      }).catch(error => {
        console.error("Não foi possível observar o acesso aos simulados:", error);
      });
    }

    const host = await waitForHost();
    if (host && !host.hidden) void mountSimulation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();