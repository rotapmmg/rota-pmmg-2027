(() => {
  "use strict";

  const LAST_LESSON_KEY = "pmmgLastPremiumLesson";
  const $ = (selector, root = document) => root.querySelector(selector);

  function readLastLesson() {
    try {
      const raw = localStorage.getItem(LAST_LESSON_KEY);
      const value = raw ? JSON.parse(raw) : null;
      return value && typeof value === "object" ? value : null;
    } catch {
      return null;
    }
  }

  function waitFor(predicate, attempts = 40, delay = 100) {
    return new Promise(resolve => {
      let count = 0;
      const check = () => {
        const value = predicate();
        if (value || count >= attempts) {
          resolve(value || null);
          return;
        }
        count += 1;
        setTimeout(check, delay);
      };
      check();
    });
  }

  async function ensurePremiumOpen(mode) {
    let page = $("#premium.active");
    if (!page) {
      const button = $(`[data-premium-sidebar="${mode}"]`) || $(`[data-premium-sheet="${mode}"]`);
      button?.click();
      page = await waitFor(() => $("#premium.active"), 20, 100);
    }
    return page;
  }

  async function focusPanel(mode, openLastLesson = false) {
    const page = await ensurePremiumOpen(mode);
    if (!page) return;

    const panelId = mode === "practice"
      ? "premiumPracticeSection"
      : mode === "simulation"
        ? "premiumSimulationSection"
        : "premiumStudySection";

    const panel = await waitFor(() => {
      const target = document.getElementById(panelId);
      return target && !target.hidden ? target : null;
    }, 30, 100);

    if (!panel) return;

    if (mode === "study" && openLastLesson) {
      const saved = readLastLesson();
      if (saved?.id) {
        const lessonButton = await waitFor(
          () => panel.querySelector(`[data-premium-lesson="${CSS.escape(String(saved.id))}"]`),
          35,
          100
        );

        if (lessonButton) {
          lessonButton.click();
          await waitFor(() => panel.querySelector(".premium-study-lesson"), 35, 100);
        }
      }
    }

    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setSidebarLoginState(text, disabled = false) {
    const button = $("#sidebarGoogleLogin");
    if (!button) return;
    button.disabled = disabled;
    button.innerHTML = `<span>G</span><span>${text}</span>`;
  }

  async function handleSidebarGoogleLogin(event) {
    const button = event.target.closest?.("#sidebarGoogleLogin");
    if (!button) return false;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const firebase = window.firebaseSync;
    if (!firebase?.loginWithGoogle) {
      setSidebarLoginState("Login carregando…", true);
      window.setTimeout(() => {
        setSidebarLoginState("Entrar com Google", false);
        alert("O login ainda estava inicializando. Tente novamente agora.");
      }, 1200);
      return true;
    }

    setSidebarLoginState("Abrindo Google…", true);

    const timeout = window.setTimeout(() => {
      if (document.body.contains(button) && button.disabled) {
        setSidebarLoginState("Entrar com Google", false);
      }
    }, 12000);

    try {
      const result = await firebase.loginWithGoogle();
      window.clearTimeout(timeout);

      const user = result?.user || await firebase.getCurrentFirebaseUser();
      if (user) {
        button.innerHTML = `<span>✓</span><span>Google conectado</span>`;
        button.disabled = true;
        button.title = user.email || "Conta Google conectada";
      } else {
        setSidebarLoginState("Entrar com Google", false);
      }
    } catch (error) {
      window.clearTimeout(timeout);
      console.error("Não foi possível entrar com Google pelo menu lateral:", error);
      setSidebarLoginState("Entrar com Google", false);

      if (error?.code !== "auth/popup-closed-by-user") {
        alert("Não foi possível abrir o login do Google. Verifique se pop-ups estão permitidos e tente novamente.");
      }
    }

    return true;
  }

  document.addEventListener("click", event => {
    if (event.target.closest?.("#sidebarGoogleLogin")) {
      void handleSidebarGoogleLogin(event);
      return;
    }

    const continueButton = event.target.closest?.("#dashboardContinueStudy");
    if (continueButton) {
      setTimeout(() => void focusPanel("study", true), 0);
      return;
    }

    const shortcut = event.target.closest?.("[data-dashboard-premium]");
    if (shortcut) {
      const mode = shortcut.dataset.dashboardPremium || "study";
      setTimeout(() => void focusPanel(mode, false), 0);
    }
  }, true);
})();
