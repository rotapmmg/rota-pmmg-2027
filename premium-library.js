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

  async function waitForPremiumPage() {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const page = $("#premium");
      if (page && window.firebaseSync) return page;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return null;
  }

  function renderLocked(container, message) {
    container.innerHTML = `
      <article class="panel premium-compare">
        <span class="eyebrow">BIBLIOTECA PREMIUM</span>
        <h3>🔒 Aulas Premium</h3>
        <p class="muted">${escapeHtml(message)}</p>
        <small class="premium-note">
          O conteúdo das aulas não é enviado ao navegador enquanto o Firestore não autorizar o acesso.
        </small>
      </article>
    `;
  }

  function normalizeGroup(value, fallback) {
    const text = String(value ?? "").trim();
    return text || fallback;
  }

  function groupLessons(lessons) {
    const subjects = new Map();

    lessons.forEach(lesson => {
      const subject = normalizeGroup(lesson.subject, "Geral");
      const module = normalizeGroup(lesson.module, "Módulo geral");

      if (!subjects.has(subject)) subjects.set(subject, new Map());
      const modules = subjects.get(subject);
      if (!modules.has(module)) modules.set(module, []);
      modules.get(module).push(lesson);
    });

    return subjects;
  }

  function getVideoSource(rawUrl) {
    if (!rawUrl) return null;

    try {
      const url = new URL(String(rawUrl));
      if (url.protocol !== "https:") return null;

      const host = url.hostname.toLowerCase();

      if (host === "youtu.be") {
        const id = url.pathname.split("/").filter(Boolean)[0];
        return id ? { type: "iframe", url: `https://www.youtube.com/embed/${encodeURIComponent(id)}` } : null;
      }

      if (host.endsWith("youtube.com")) {
        if (url.pathname === "/watch") {
          const id = url.searchParams.get("v");
          return id ? { type: "iframe", url: `https://www.youtube.com/embed/${encodeURIComponent(id)}` } : null;
        }

        if (url.pathname.startsWith("/embed/")) {
          return { type: "iframe", url: url.href };
        }
      }

      if (host === "vimeo.com" || host === "www.vimeo.com") {
        const id = url.pathname.split("/").filter(Boolean)[0];
        return id ? { type: "iframe", url: `https://player.vimeo.com/video/${encodeURIComponent(id)}` } : null;
      }

      if (/\.(mp4|webm)(?:$|\?)/i.test(url.href)) {
        return { type: "video", url: url.href };
      }

      return null;
    } catch {
      return null;
    }
  }

  function renderVideo(lesson) {
    const source = getVideoSource(lesson.videoUrl);
    if (!source) return "";

    const label = lesson.videoType === "ai" || lesson.aiVideo === true
      ? "Vídeo explicativo com IA"
      : "Vídeo explicativo";

    if (source.type === "video") {
      return `
        <div class="lesson-block" style="margin-top:22px;">
          <h3>🎥 ${escapeHtml(label)}</h3>
          <video controls playsinline preload="metadata" style="width:100%; border-radius:16px; margin-top:10px;">
            <source src="${escapeHtml(source.url)}">
            Seu navegador não conseguiu reproduzir este vídeo.
          </video>
        </div>
      `;
    }

    return `
      <div class="lesson-block" style="margin-top:22px;">
        <h3>🎥 ${escapeHtml(label)}</h3>
        <div style="position:relative; width:100%; aspect-ratio:16/9; margin-top:10px; overflow:hidden; border-radius:16px; background:#000;">
          <iframe
            src="${escapeHtml(source.url)}"
            title="${escapeHtml(label)}"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            style="position:absolute; inset:0; width:100%; height:100%; border:0;"
          ></iframe>
        </div>
      </div>
    `;
  }

  function renderQuestionBank(container, questions) {
    if (!questions.length) {
      container.innerHTML = `
        <div class="lesson-block">
          <h3>📝 Questões da aula</h3>
          <p class="muted">Nenhuma questão foi publicada para esta aula ainda.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="lesson-block">
        <h3>📝 Questões da aula</h3>
        <p class="muted">${questions.length} questão${questions.length === 1 ? "" : "ões"} disponível${questions.length === 1 ? "" : "is"}. Resolva e veja a explicação na hora.</p>
        <div id="premiumQuestionList">
          ${questions.map((question, questionIndex) => {
            const options = Array.isArray(question.options) ? question.options : [];
            return `
              <article class="panel" data-question-card="${questionIndex}" style="margin-top:16px;">
                <span class="eyebrow">QUESTÃO ${questionIndex + 1}</span>
                <p style="font-weight:700;">${escapeHtml(question.prompt || question.question || "Questão")}</p>
                <div style="display:grid; gap:10px; margin-top:14px;">
                  ${options.map((option, optionIndex) => `
                    <button
                      class="ghost-btn"
                      type="button"
                      data-question="${questionIndex}"
                      data-option="${optionIndex}"
                      style="width:100%; text-align:left;"
                    >
                      ${String.fromCharCode(65 + optionIndex)}. ${escapeHtml(option)}
                    </button>
                  `).join("")}
                </div>
                <div data-question-feedback="${questionIndex}" hidden style="margin-top:14px;"></div>
              </article>
            `;
          }).join("")}
        </div>
      </div>
    `;

    container.querySelectorAll("[data-question][data-option]").forEach(button => {
      button.addEventListener("click", () => {
        const questionIndex = Number(button.dataset.question);
        const optionIndex = Number(button.dataset.option);
        const question = questions[questionIndex];
        const correctIndex = Number(question.correctIndex);
        const correct = Number.isInteger(correctIndex) && optionIndex === correctIndex;
        const card = container.querySelector(`[data-question-card="${questionIndex}"]`);
        const feedback = container.querySelector(`[data-question-feedback="${questionIndex}"]`);

        card?.querySelectorAll("[data-question]").forEach(optionButton => {
          optionButton.disabled = true;
        });

        if (feedback) {
          const explanation = question.explanation
            ? `<p class="muted" style="margin-top:8px;">${escapeHtml(question.explanation)}</p>`
            : "";
          feedback.hidden = false;
          feedback.innerHTML = `
            <strong>${correct ? "✅ Resposta correta" : "❌ Resposta incorreta"}</strong>
            ${!correct && Number.isInteger(correctIndex) && question.options?.[correctIndex] !== undefined
              ? `<p style="margin-top:8px;">Correta: ${String.fromCharCode(65 + correctIndex)}. ${escapeHtml(question.options[correctIndex])}</p>`
              : ""}
            ${explanation}
          `;
        }
      });
    });
  }

  async function loadQuestionsIntoLesson(lessonId) {
    const container = $("#premiumLessonQuestions");
    if (!container || !window.firebaseSync?.loadPremiumQuestions) return;

    try {
      const questions = await window.firebaseSync.loadPremiumQuestions(lessonId);
      renderQuestionBank(container, questions);
    } catch (error) {
      console.error("Não foi possível carregar as questões Premium:", error);
      const denied = String(error?.code || "").includes("permission-denied");
      container.innerHTML = `
        <div class="lesson-block">
          <h3>📝 Questões da aula</h3>
          <p class="muted">${denied
            ? "O banco de questões ainda precisa ser liberado nas Security Rules do Firestore."
            : "Não foi possível carregar as questões agora."}</p>
        </div>
      `;
    }
  }

  function renderLessonPage(page, lesson) {
    const subject = normalizeGroup(lesson.subject, "Geral");
    const module = normalizeGroup(lesson.module, "Módulo geral");

    page.innerHTML = `
      <article class="panel premium-compare">
        <button class="ghost-btn" id="premiumLibraryBack" type="button">← Voltar para aulas Premium</button>
        <span class="eyebrow">AULA PREMIUM • ACESSO PROTEGIDO</span>
        <h2>${escapeHtml(lesson.title || "Aula Premium")}</h2>
        <p class="muted">${escapeHtml(subject)} • ${escapeHtml(module)}${lesson.duration ? ` • ${escapeHtml(lesson.duration)}` : ""}</p>

        ${renderVideo(lesson)}

        <div class="lesson-block" style="margin-top:22px;">
          <h3>Conteúdo da aula</h3>
          <p>${escapeHtml(lesson.content || "Conteúdo Premium carregado.")}</p>
        </div>

        <div id="premiumLessonQuestions" style="margin-top:22px;">
          <div class="lesson-block">
            <h3>📝 Questões da aula</h3>
            <p class="muted">Carregando banco de questões…</p>
          </div>
        </div>

        <div class="lesson-block" style="margin-top:22px;">
          <strong>🔐 Conteúdo protegido</strong>
          <p class="muted">Esta aula e suas questões são solicitadas ao Firestore somente após a autenticação e a autorização das Security Rules.</p>
        </div>
      </article>
    `;

    const title = $("#pageTitle");
    if (title) title.textContent = "Aula Premium";

    $("#premiumLibraryBack")?.addEventListener("click", () => {
      window.location.reload();
    });

    loadQuestionsIntoLesson(lesson.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderCatalog(container, lessons) {
    const grouped = groupLessons(lessons);

    const subjectHtml = [...grouped.entries()].map(([subject, modules]) => {
      const moduleHtml = [...modules.entries()].map(([module, moduleLessons]) => `
        <section style="margin-top:18px;">
          <h4 style="margin-bottom:8px;">${escapeHtml(module)}</h4>
          <div class="history-list">
            ${moduleLessons.map((lesson, index) => `
              <button
                class="ghost-btn"
                type="button"
                data-premium-lesson="${escapeHtml(lesson.id)}"
                style="width:100%; text-align:left; margin-top:10px;"
              >
                <strong>${index + 1}. ${escapeHtml(lesson.title || lesson.id)}</strong>
                <br><small>${lesson.videoUrl ? "🎥 Vídeo • " : ""}${lesson.duration ? escapeHtml(lesson.duration) : "Aula Premium"}</small>
              </button>
            `).join("")}
          </div>
        </section>
      `).join("");

      const subjectCount = [...modules.values()].reduce((sum, list) => sum + list.length, 0);

      return `
        <article class="panel premium-compare" style="margin-top:16px;">
          <span class="eyebrow">DISCIPLINA PREMIUM</span>
          <h3>${escapeHtml(subject)}</h3>
          <p class="muted">${subjectCount} aula${subjectCount === 1 ? "" : "s"}</p>
          ${moduleHtml}
        </article>
      `;
    }).join("");

    container.innerHTML = `
      <article class="panel premium-compare">
        <span class="eyebrow">BIBLIOTECA PREMIUM</span>
        <h2>Suas aulas Premium</h2>
        <p class="muted">${lessons.length} aula${lessons.length === 1 ? "" : "s"} disponível${lessons.length === 1 ? "" : "is"}, organizadas por disciplina e módulo.</p>
        <p class="muted">A estrutura suporta vídeo explicativo e banco de questões por aula.</p>
      </article>
      ${subjectHtml}
    `;
  }

  async function mountLibrary() {
    const page = await waitForPremiumPage();
    if (!page) return;

    $("#premiumProtectedTestCard")?.remove();

    let container = $("#premiumLessonLibrary", page);
    if (!container) {
      container = document.createElement("section");
      container.id = "premiumLessonLibrary";
      const hero = $(".premium-hero", page);
      if (hero) hero.insertAdjacentElement("afterend", container);
      else page.prepend(container);
    }

    container.innerHTML = `
      <article class="panel premium-compare">
        <span class="eyebrow">BIBLIOTECA PREMIUM</span>
        <h3>Carregando suas aulas…</h3>
        <p class="muted">Verificando seu plano e consultando o Firestore.</p>
      </article>
    `;

    try {
      const user = await window.firebaseSync.getCurrentFirebaseUser();
      if (!user) {
        renderLocked(container, "Entre com Google para verificar seu acesso às aulas Premium.");
        return;
      }

      const plan = await window.firebaseSync.loadUserPlan();
      if (plan !== "premium") {
        renderLocked(container, "Sua conta está no plano Grátis. As aulas Premium permanecem bloqueadas.");
        return;
      }

      const lessons = await window.firebaseSync.loadPremiumLessons();

      if (!lessons.length) {
        container.innerHTML = `
          <article class="panel premium-compare">
            <span class="eyebrow">BIBLIOTECA PREMIUM</span>
            <h3>Nenhuma aula publicada ainda</h3>
            <p class="muted">Sua conta Premium está ativa, mas a biblioteca ainda está vazia.</p>
          </article>
        `;
        return;
      }

      renderCatalog(container, lessons);

      container.querySelectorAll("[data-premium-lesson]").forEach(button => {
        button.addEventListener("click", async () => {
          const lessonId = button.dataset.premiumLesson;
          button.disabled = true;
          try {
            const lesson = await window.firebaseSync.loadPremiumLesson(lessonId);
            if (!lesson) throw new Error("Aula não encontrada.");
            renderLessonPage(page, lesson);
          } catch (error) {
            console.error("Não foi possível abrir a aula Premium:", error);
            const denied = String(error?.code || "").includes("permission-denied");
            alert(denied
              ? "Acesso Premium negado pelas regras do Firestore."
              : "Não foi possível abrir esta aula agora.");
          } finally {
            button.disabled = false;
          }
        });
      });
    } catch (error) {
      console.error("Não foi possível carregar a biblioteca Premium:", error);
      const denied = String(error?.code || "").includes("permission-denied");
      renderLocked(
        container,
        denied
          ? "O Firestore bloqueou o acesso às aulas Premium para esta conta."
          : "Não foi possível carregar a biblioteca Premium agora."
      );
    }
  }

  async function init() {
    await mountLibrary();

    if (window.firebaseSync?.observeFirebaseUser) {
      window.firebaseSync.observeFirebaseUser(() => {
        setTimeout(mountLibrary, 0);
      }).catch(error => {
        console.error("Não foi possível observar o acesso Premium:", error);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
