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

  function renderLessonPage(page, lesson) {
    const subject = normalizeGroup(lesson.subject, "Geral");
    const module = normalizeGroup(lesson.module, "Módulo geral");

    page.innerHTML = `
      <article class="panel premium-compare">
        <button class="ghost-btn" id="premiumLibraryBack" type="button">← Voltar para aulas Premium</button>
        <span class="eyebrow">AULA PREMIUM • ACESSO PROTEGIDO</span>
        <h2>${escapeHtml(lesson.title || "Aula Premium")}</h2>
        <p class="muted">${escapeHtml(subject)} • ${escapeHtml(module)}</p>

        <div class="lesson-block">
          <h3>Conteúdo da aula</h3>
          <p>${escapeHtml(lesson.content || "Conteúdo Premium carregado.")}</p>
        </div>

        <div class="lesson-block">
          <strong>🔐 Conteúdo protegido</strong>
          <p class="muted">Esta aula foi obtida do Firestore somente após a autorização das Security Rules.</p>
        </div>
      </article>
    `;

    const title = $("#pageTitle");
    if (title) title.textContent = "Aula Premium";

    $("#premiumLibraryBack")?.addEventListener("click", () => {
      window.location.reload();
    });

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
                ${lesson.duration ? `<br><small>${escapeHtml(lesson.duration)}</small>` : ""}
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
