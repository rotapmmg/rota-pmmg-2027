(() => {
  "use strict";

  const DEFAULT_BATCH_SIZE = 20;
  const $ = (selector, root = document) => root.querySelector(selector);
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

  async function waitForPracticeSection() {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const section = $("#premiumPracticeSection");
      if (section && window.firebaseSync) return section;
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

  function renderLocked(host, message) {
    host.innerHTML = `
      <div class="premium-empty-state">
        <span class="premium-empty-icon">🔒</span>
        <h3>Banco de questões Premium</h3>
        <p class="muted">${escapeHtml(message)}</p>
      </div>
    `;
  }

  function renderQuestionBatch(host, allQuestions, subject) {
    const batch = shuffle(allQuestions).slice(0, Math.min(DEFAULT_BATCH_SIZE, allQuestions.length));
    const answers = new Map();

    host.innerHTML = `
      <div class="premium-practice-toolbar">
        <button class="ghost-btn" id="premiumPracticeBack" type="button">← Trocar disciplina</button>
        <button class="ghost-btn" id="premiumNewBatch" type="button">↻ Nova bateria</button>
      </div>

      <div class="premium-section-intro">
        <div>
          <span class="eyebrow">PRATICAR • ${escapeHtml(subject)}</span>
          <h3>Bateria de ${batch.length} questões</h3>
          <p class="muted">Banco disponível nesta disciplina: ${allQuestions.length} questão${allQuestions.length === 1 ? "" : "ões"}. O gabarito aparece somente após a correção.</p>
        </div>
      </div>

      <div class="premium-question-list">
        ${batch.map((question, questionIndex) => {
          const options = Array.isArray(question.options) ? question.options : [];
          const context = [question.module, question.lessonTitle].filter(Boolean).join(" • ");
          return `
            <article class="premium-question-card" data-premium-question-card="${escapeHtml(question.id)}">
              ${context ? `<small class="premium-question-context">${escapeHtml(context)}</small>` : ""}
              <strong class="premium-question-title">${questionIndex + 1}. ${escapeHtml(question.question)}</strong>
              <div class="premium-option-list">
                ${options.map((option, optionIndex) => {
                  const id = optionId(option, optionIndex);
                  return `
                    <button
                      class="premium-option-button"
                      type="button"
                      data-premium-question-id="${escapeHtml(question.id)}"
                      data-premium-option-id="${escapeHtml(id)}"
                      aria-pressed="false"
                    >
                      <strong>${escapeHtml(id)}.</strong>
                      <span>${escapeHtml(optionText(option))}</span>
                    </button>
                  `;
                }).join("")}
              </div>
              <div data-premium-feedback="${escapeHtml(question.id)}" class="premium-question-feedback" hidden></div>
            </article>
          `;
        }).join("")}
      </div>

      <button class="primary-btn premium-grade-button" id="premiumGradeQuestions" type="button">Corrigir bateria</button>
      <div id="premiumQuestionResult" class="premium-question-result" hidden></div>
    `;

    host.querySelectorAll("[data-premium-question-id]").forEach(button => {
      button.addEventListener("click", () => {
        const questionId = button.dataset.premiumQuestionId;
        const selectedOptionId = button.dataset.premiumOptionId;
        answers.set(questionId, selectedOptionId);

        host.querySelectorAll(`[data-premium-question-id="${CSS.escape(questionId)}"]`).forEach(optionButton => {
          const selected = optionButton.dataset.premiumOptionId === selectedOptionId;
          optionButton.setAttribute("aria-pressed", selected ? "true" : "false");
          optionButton.classList.toggle("selected", selected);
        });

        const feedback = host.querySelector(`[data-premium-feedback="${CSS.escape(questionId)}"]`);
        if (feedback) feedback.hidden = true;
        const result = $("#premiumQuestionResult", host);
        if (result) result.hidden = true;
      });
    });

    $("#premiumGradeQuestions", host)?.addEventListener("click", () => {
      let score = 0;

      batch.forEach(question => {
        const selected = answers.get(question.id);
        const correct = String(question.correctOptionId ?? "");
        const isCorrect = selected === correct;
        if (isCorrect) score += 1;

        const feedback = host.querySelector(`[data-premium-feedback="${CSS.escape(question.id)}"]`);
        if (!feedback) return;

        const options = Array.isArray(question.options) ? question.options : [];
        const correctOption = options.find((option, index) => optionId(option, index) === correct);
        const correctText = optionText(correctOption);

        feedback.hidden = false;
        feedback.classList.toggle("correct", Boolean(selected && isCorrect));
        feedback.classList.toggle("incorrect", Boolean(selected && !isCorrect));
        feedback.innerHTML = selected
          ? `<strong>${isCorrect ? "✅ Correto" : `❌ Incorreto — resposta correta: ${escapeHtml(correct)}`}</strong><p>${escapeHtml(correctText)}</p><small>${escapeHtml(question.explanation || "")}</small>`
          : `<strong>⚠️ Não respondida — resposta correta: ${escapeHtml(correct)}</strong><p>${escapeHtml(correctText)}</p><small>${escapeHtml(question.explanation || "")}</small>`;
      });

      const result = $("#premiumQuestionResult", host);
      if (result) {
        const percentage = Math.round((score / batch.length) * 100);
        result.hidden = false;
        result.innerHTML = `<span>Resultado da bateria</span><strong>${score}/${batch.length}</strong><b>${percentage}% de acertos</b>`;
        result.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    $("#premiumPracticeBack", host)?.addEventListener("click", () => void mountPractice());
    $("#premiumNewBatch", host)?.addEventListener("click", () => {
      renderQuestionBatch(host, allQuestions, subject);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  async function openSubject(host, subject, button) {
    if (button) button.disabled = true;
    host.innerHTML = `
      <div class="premium-empty-state">
        <span class="premium-empty-icon">✍️</span>
        <h3>Carregando questões de ${escapeHtml(subject)}…</h3>
        <p class="muted">Montando uma bateria de prática.</p>
      </div>
    `;

    try {
      const questions = await window.firebaseSync.loadPremiumQuestionsBySubject(subject);
      if (!questions.length) {
        host.innerHTML = `
          <div class="premium-empty-state">
            <span class="premium-empty-icon">✍️</span>
            <h3>Nenhuma questão encontrada</h3>
            <p class="muted">Ainda não há questões publicadas para ${escapeHtml(subject)}.</p>
            <button class="ghost-btn" id="premiumPracticeBack" type="button">← Voltar</button>
          </div>
        `;
        $("#premiumPracticeBack", host)?.addEventListener("click", () => void mountPractice());
        return;
      }

      renderQuestionBatch(host, questions, subject);
    } catch (error) {
      console.error("Não foi possível carregar as questões Premium:", error);
      const denied = String(error?.code || "").includes("permission-denied");
      renderLocked(host, denied
        ? "O Firestore bloqueou o acesso às questões para esta conta."
        : "Não foi possível carregar o banco de questões agora.");
    } finally {
      if (button) button.disabled = false;
    }
  }

  function renderSubjects(host, lessons) {
    const subjects = [...new Set(
      lessons
        .filter(lesson => lesson.active !== false)
        .map(lesson => String(lesson.subject || "").trim())
        .filter(Boolean)
    )];

    host.innerHTML = `
      <div class="premium-section-intro">
        <div>
          <span class="eyebrow">PRATICAR</span>
          <h3>Banco de questões por disciplina</h3>
          <p class="muted">Escolha a matéria. A teoria continua separada na aba Estudar.</p>
        </div>
      </div>

      <div class="premium-practice-subjects">
        ${subjects.map(subject => `
          <button class="premium-practice-subject" type="button" data-premium-practice-subject="${escapeHtml(subject)}">
            <span>✍️</span>
            <strong>${escapeHtml(subject)}</strong>
            <small>Abrir banco de questões</small>
          </button>
        `).join("")}
      </div>
    `;

    host.querySelectorAll("[data-premium-practice-subject]").forEach(button => {
      button.addEventListener("click", () => {
        void openSubject(host, button.dataset.premiumPracticeSubject, button);
      });
    });
  }

  async function mountPractice() {
    const host = await waitForPracticeSection();
    if (!host) return;

    host.innerHTML = `
      <div class="premium-empty-state">
        <span class="premium-empty-icon">✍️</span>
        <h3>Carregando banco de questões…</h3>
        <p class="muted">Verificando seu acesso Premium.</p>
      </div>
    `;

    try {
      const user = await window.firebaseSync.getCurrentFirebaseUser();
      if (!user) {
        renderLocked(host, "Entre com Google para acessar o banco de questões Premium.");
        return;
      }

      const plan = await window.firebaseSync.loadUserPlan();
      if (plan !== "premium") {
        renderLocked(host, "Sua conta está no plano Grátis. O banco completo permanece bloqueado.");
        return;
      }

      const lessons = await window.firebaseSync.loadPremiumLessons();
      renderSubjects(host, lessons);
    } catch (error) {
      console.error("Não foi possível iniciar a prática Premium:", error);
      const denied = String(error?.code || "").includes("permission-denied");
      renderLocked(host, denied
        ? "O Firestore bloqueou o acesso ao banco Premium para esta conta."
        : "Não foi possível abrir a área de prática agora.");
    }
  }

  async function init() {
    await mountPractice();

    document.addEventListener("pmmg:premium-mode", event => {
      if (event.detail?.mode === "practice") void mountPractice();
    });

    if (window.firebaseSync?.observeFirebaseUser) {
      window.firebaseSync.observeFirebaseUser(() => {
        setTimeout(() => void mountPractice(), 0);
      }).catch(error => {
        console.error("Não foi possível observar o acesso ao banco Premium:", error);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();