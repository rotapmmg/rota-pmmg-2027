(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const escapeHtml = value =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const optionText = option =>
    typeof option === "string"
      ? option
      : String(option?.text ?? "");

  const optionId = (option, index) =>
    typeof option === "object" && option?.id
      ? String(option.id)
      : String.fromCharCode(65 + index);

  async function waitForRenderedLesson() {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const backButton = $("#premiumLibraryBack");
      const lessonPanel = backButton?.closest("article.panel");
      if (lessonPanel) return lessonPanel;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return null;
  }

  function renderLoading(host) {
    host.innerHTML = `
      <div class="lesson-block">
        <h3>📝 Questões da aula</h3>
        <p class="muted">Carregando questões Premium…</p>
      </div>
    `;
  }

  function renderEmpty(host) {
    host.innerHTML = `
      <div class="lesson-block">
        <h3>📝 Questões da aula</h3>
        <p class="muted">Ainda não há questões publicadas para esta aula.</p>
      </div>
    `;
  }

  function renderError(host, error) {
    const denied = String(error?.code || "").includes("permission-denied");
    host.innerHTML = `
      <div class="lesson-block">
        <h3>📝 Questões da aula</h3>
        <p class="muted">${escapeHtml(
          denied
            ? "O Firestore bloqueou o acesso às questões para esta conta."
            : "Não foi possível carregar as questões agora."
        )}</p>
      </div>
    `;
  }

  function renderQuestions(host, questions) {
    const answers = new Map();

    host.innerHTML = `
      <div class="lesson-block">
        <span class="eyebrow">TREINO PREMIUM</span>
        <h3>📝 Questões da aula</h3>
        <p class="muted">Responda as ${questions.length} questões e confira o gabarito comentado ao final.</p>

        <div id="premiumQuestionList">
          ${questions.map((question, questionIndex) => {
            const options = Array.isArray(question.options) ? question.options : [];
            return `
              <article
                data-premium-question-card="${escapeHtml(question.id)}"
                style="margin-top:16px; padding:16px; border:1px solid var(--line); border-radius:16px;"
              >
                <strong>${questionIndex + 1}. ${escapeHtml(question.question)}</strong>
                <div style="margin-top:12px; display:grid; gap:8px;">
                  ${options.map((option, optionIndex) => {
                    const id = optionId(option, optionIndex);
                    return `
                      <button
                        class="ghost-btn"
                        type="button"
                        data-premium-question-id="${escapeHtml(question.id)}"
                        data-premium-option-id="${escapeHtml(id)}"
                        aria-pressed="false"
                        style="width:100%; text-align:left;"
                      >
                        <strong>${escapeHtml(id)}.</strong> ${escapeHtml(optionText(option))}
                      </button>
                    `;
                  }).join("")}
                </div>
                <div
                  data-premium-feedback="${escapeHtml(question.id)}"
                  class="muted"
                  style="display:none; margin-top:12px; padding:12px; border:1px solid var(--line); border-radius:12px;"
                ></div>
              </article>
            `;
          }).join("")}
        </div>

        <button
          class="primary-btn"
          id="premiumGradeQuestions"
          type="button"
          style="width:100%; margin-top:16px;"
        >
          Corrigir questões
        </button>
        <div
          id="premiumQuestionResult"
          style="display:none; margin-top:12px; padding:14px; border:1px solid var(--line); border-radius:14px;"
        ></div>
      </div>
    `;

    host.querySelectorAll("[data-premium-question-id]").forEach(button => {
      button.addEventListener("click", () => {
        const questionId = button.dataset.premiumQuestionId;
        const selectedOptionId = button.dataset.premiumOptionId;
        answers.set(questionId, selectedOptionId);

        host.querySelectorAll("[data-premium-question-id]").forEach(optionButton => {
          if (optionButton.dataset.premiumQuestionId !== questionId) return;
          const selected = optionButton.dataset.premiumOptionId === selectedOptionId;
          optionButton.setAttribute("aria-pressed", selected ? "true" : "false");
          optionButton.style.outline = selected ? "2px solid var(--accent)" : "none";
        });

        const feedback = host.querySelector(`[data-premium-feedback="${questionId}"]`);
        if (feedback) feedback.style.display = "none";
        const result = $("#premiumQuestionResult", host);
        if (result) result.style.display = "none";
      });
    });

    $("#premiumGradeQuestions", host)?.addEventListener("click", () => {
      let score = 0;

      questions.forEach(question => {
        const selected = answers.get(question.id);
        const correct = String(question.correctOptionId ?? "");
        const isCorrect = selected === correct;
        if (isCorrect) score += 1;

        const feedback = host.querySelector(`[data-premium-feedback="${question.id}"]`);
        if (!feedback) return;

        const options = Array.isArray(question.options) ? question.options : [];
        const correctOption = options.find((option, index) => optionId(option, index) === correct);
        const correctText = optionText(correctOption);

        feedback.style.display = "block";
        feedback.innerHTML = selected
          ? `<strong>${isCorrect ? "✅ Correto" : `❌ Incorreto — resposta ${escapeHtml(correct)}`}</strong><br>${escapeHtml(correctText)}<br><small>${escapeHtml(question.explanation || "")}</small>`
          : `<strong>⚠️ Não respondida — resposta ${escapeHtml(correct)}</strong><br>${escapeHtml(correctText)}<br><small>${escapeHtml(question.explanation || "")}</small>`;
      });

      const result = $("#premiumQuestionResult", host);
      if (result) {
        const percentage = Math.round((score / questions.length) * 100);
        result.style.display = "block";
        result.innerHTML = `<strong>Resultado: ${score}/${questions.length} (${percentage}%)</strong>`;
        result.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  async function mountQuestions(lessonId) {
    if (!lessonId || !window.firebaseSync?.loadPremiumQuestions) return;

    const lessonPanel = await waitForRenderedLesson();
    if (!lessonPanel) return;

    $("#premiumLessonQuestions", lessonPanel)?.remove();

    const host = document.createElement("section");
    host.id = "premiumLessonQuestions";
    lessonPanel.append(host);
    renderLoading(host);

    try {
      const questions = await window.firebaseSync.loadPremiumQuestions(lessonId);
      if (!questions.length) {
        renderEmpty(host);
        return;
      }
      renderQuestions(host, questions);
    } catch (error) {
      console.error("Não foi possível carregar as questões Premium:", error);
      renderError(host, error);
    }
  }

  document.addEventListener("click", event => {
    const lessonButton = event.target.closest?.("[data-premium-lesson]");
    if (!lessonButton) return;
    const lessonId = lessonButton.dataset.premiumLesson;
    void mountQuestions(lessonId);
  });
})();
