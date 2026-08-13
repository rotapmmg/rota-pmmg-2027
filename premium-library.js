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

  function renderLessonPage(page, lesson, reloadLibrary) {
    page.innerHTML = `
      <article class="panel premium-compare">
        <button class="ghost-btn" id="premiumLibraryBack" type="button">← Voltar para aulas Premium</button>
        <span class="eyebrow">AULA PREMIUM • ACESSO PROTEGIDO</span>
        <h2>${escapeHtml(lesson.title || "Aula Premium")}</h2>
        ${lesson.subject ? `<p class="muted">${escapeHtml(lesson.subject)}</p>` : ""}

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

    $("#premiumLibraryBack")?.addEventListener("click", async () => {
      page.remove();
      if (typeof window.location?.reload === "function") {
        window.location.reload();
        return;
      }
      await reloadLibrary();
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
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

      container.innerHTML = `
        <article class="panel premium-compare">
          <span class="eyebrow">BIBLIOTECA PREMIUM</span>
          <h3>Suas aulas Premium</h3>
          <p class="muted">${lessons.length} aula${lessons.length === 1 ? "" : "s"} disponível${lessons.length === 1 ? "" : "is"}.</p>
          <div class="history-list" id="premiumLessonList">
            ${lessons.map(lesson => `
              <button class="ghost-btn" type="button" data-premium-lesson="${escapeHtml(lesson.id)}" style="width:100%; text-align:left; margin-top:10px;">
                <strong>${escapeHtml(lesson.title || lesson.id)}</strong>
                ${lesson.subject ? `<br><small>${escapeHtml(lesson.subject)}</small>` : ""}
              </button>
            `).join("")}
          </div>
        </article>
      `;

      container.querySelectorAll("[data-premium-lesson]").forEach(button => {
        button.addEventListener("click", async () => {
          const lessonId = button.dataset.premiumLesson;
          button.disabled = true;
          try {
            const lesson = await window.firebaseSync.loadPremiumLesson(lessonId);
            if (!lesson) throw new Error("Aula não encontrada.");
            renderLessonPage(page, lesson, mountLibrary);
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
