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

  async function waitForStudySection() {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const section = $("#premiumStudySection");
      if (section && window.firebaseSync) return section;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return null;
  }

  function renderLocked(container, message) {
    container.innerHTML = `
      <div class="premium-empty-state">
        <span class="premium-empty-icon">🔒</span>
        <h3>Área de estudo Premium</h3>
        <p class="muted">${escapeHtml(message)}</p>
      </div>
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

  function safeVideoId(value) {
    const id = String(value || "").trim();
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
  }

  function renderVideo(lesson) {
    const videoId = safeVideoId(lesson.videoId);
    if (!videoId) return "";

    return `
      <div class="lesson-block premium-video-block">
        <span class="eyebrow">VIDEOAULA</span>
        <div class="premium-video-frame">
          <iframe
            src="https://www.youtube-nocookie.com/embed/${videoId}"
            title="Videoaula: ${escapeHtml(lesson.title || "Aula Premium")}"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    `;
  }

  function renderLessonPage(container, lesson) {
    const subject = normalizeGroup(lesson.subject, "Geral");
    const module = normalizeGroup(lesson.module, "Módulo geral");

    container.innerHTML = `
      <article class="premium-study-lesson">
        <button class="ghost-btn" id="premiumLibraryBack" type="button">← Voltar para aulas</button>
        <span class="eyebrow">ESTUDAR • AULA PREMIUM</span>
        <h2>${escapeHtml(lesson.title || "Aula Premium")}</h2>
        <p class="muted">${escapeHtml(subject)} • ${escapeHtml(module)}</p>

        ${renderVideo(lesson)}

        <div class="lesson-block premium-theory-block">
          <span class="eyebrow">TEORIA</span>
          <h3>Explicação da matéria</h3>
          <p>${escapeHtml(lesson.content || "Conteúdo Premium carregado.")}</p>
        </div>

        <div class="premium-study-note">
          <strong>Somente conteúdo teórico nesta área.</strong>
          <span>Para responder exercícios, abra a aba <b>Praticar</b>.</span>
        </div>
      </article>
    `;

    $("#premiumLibraryBack", container)?.addEventListener("click", () => {
      void mountLibrary();
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderCatalog(container, lessons) {
    const grouped = groupLessons(lessons);

    const subjectHtml = [...grouped.entries()].map(([subject, modules]) => {
      const moduleHtml = [...modules.entries()].map(([module, moduleLessons]) => `
        <section class="premium-library-module">
          <h4>${escapeHtml(module)}</h4>
          <div class="premium-lesson-list">
            ${moduleLessons.map((lesson, index) => `
              <button
                class="premium-lesson-button"
                type="button"
                data-premium-lesson="${escapeHtml(lesson.id)}"
              >
                <span class="premium-lesson-index">${index + 1}</span>
                <span>
                  <strong>${escapeHtml(lesson.title || lesson.id)}</strong>
                  <small>${lesson.duration ? escapeHtml(lesson.duration) : "Leitura teórica"}${safeVideoId(lesson.videoId) ? " • vídeo" : ""}</small>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            `).join("")}
          </div>
        </section>
      `).join("");

      const subjectCount = [...modules.values()].reduce((sum, list) => sum + list.length, 0);

      return `
        <article class="premium-subject-card">
          <div class="premium-subject-head">
            <div>
              <span class="eyebrow">DISCIPLINA</span>
              <h3>${escapeHtml(subject)}</h3>
            </div>
            <strong>${subjectCount} aula${subjectCount === 1 ? "" : "s"}</strong>
          </div>
          ${moduleHtml}
        </article>
      `;
    }).join("");

    container.innerHTML = `
      <div class="premium-section-intro">
        <div>
          <span class="eyebrow">ESTUDAR</span>
          <h3>Teoria organizada por disciplina</h3>
          <p class="muted">Aqui ficam apenas explicações e videoaulas. As questões foram movidas para a área Praticar.</p>
        </div>
      </div>
      <div class="premium-subject-list">${subjectHtml}</div>
    `;

    container.querySelectorAll("[data-premium-lesson]").forEach(button => {
      button.addEventListener("click", async () => {
        const lessonId = button.dataset.premiumLesson;
        button.disabled = true;
        try {
          const lesson = await window.firebaseSync.loadPremiumLesson(lessonId);
          if (!lesson) throw new Error("Aula não encontrada.");
          renderLessonPage(container, lesson);
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
  }

  async function mountLibrary() {
    const container = await waitForStudySection();
    if (!container) return;

    container.innerHTML = `
      <div class="premium-empty-state">
        <span class="premium-empty-icon">📚</span>
        <h3>Carregando suas aulas…</h3>
        <p class="muted">Verificando seu plano e consultando o conteúdo protegido.</p>
      </div>
    `;

    try {
      const user = await window.firebaseSync.getCurrentFirebaseUser();
      if (!user) {
        renderLocked(container, "Entre com Google para acessar as aulas teóricas Premium.");
        return;
      }

      const plan = await window.firebaseSync.loadUserPlan();
      if (plan !== "premium") {
        renderLocked(container, "Sua conta está no plano Grátis. As aulas Premium permanecem bloqueadas.");
        return;
      }

      const lessons = (await window.firebaseSync.loadPremiumLessons()).filter(lesson => lesson.active !== false);
      if (!lessons.length) {
        container.innerHTML = `
          <div class="premium-empty-state">
            <span class="premium-empty-icon">📚</span>
            <h3>Nenhuma aula publicada ainda</h3>
            <p class="muted">Sua conta Premium está ativa, mas a biblioteca está vazia.</p>
          </div>
        `;
        return;
      }

      renderCatalog(container, lessons);
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
        setTimeout(() => void mountLibrary(), 0);
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