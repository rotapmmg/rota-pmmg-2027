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

  document.addEventListener("click", event => {
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
