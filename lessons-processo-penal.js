(() => {
  "use strict";

  // As aulas de Processo Penal Premium são carregadas do Firestore.
  // Este arquivo funciona como bootstrap dos módulos Premium porque já é
  // carregado pelo index.html em todas as versões da página.

  const MODULES = [
    { src: "premium-library.js?v=3", id: "premium-library-module" },
    { src: "premium-questions.js?v=3", id: "premium-questions-module" },
    { src: "premium-simulations.js?v=3", id: "premium-simulations-module" },
    { src: "premium-home-bridge.js?v=3", id: "premium-home-bridge-module" }
  ];

  function waitForPremiumUI(attempts = 80) {
    return new Promise(resolve => {
      let count = 0;
      const check = () => {
        // premium-ui.js cria #premium e as três seções. Só carregamos os
        // módulos funcionais depois que essa estrutura realmente existe.
        const ready = document.getElementById("premium") &&
          document.getElementById("premiumStudySection") &&
          document.getElementById("premiumPracticeSection") &&
          document.getElementById("premiumSimulationSection");

        if (ready || count >= attempts) {
          resolve(Boolean(ready));
          return;
        }

        count += 1;
        setTimeout(check, 100);
      };
      check();
    });
  }

  function loadScript({ src, id }) {
    return new Promise((resolve, reject) => {
      const existing = document.getElementById(id);
      if (existing) {
        if (existing.dataset.loaded === "true") resolve();
        else existing.addEventListener("load", () => resolve(), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = id;
      script.src = src;
      script.async = false;
      script.addEventListener("load", () => {
        script.dataset.loaded = "true";
        resolve();
      }, { once: true });
      script.addEventListener("error", () => reject(new Error(`Falha ao carregar ${src}`)), { once: true });
      document.body.appendChild(script);
    });
  }

  async function bootstrapPremiumModules() {
    const uiReady = await waitForPremiumUI();
    if (!uiReady) {
      console.error("Área Premium não foi inicializada a tempo.");
      return;
    }

    for (const module of MODULES) {
      try {
        await loadScript(module);
      } catch (error) {
        console.error(error);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void bootstrapPremiumModules(), { once: true });
  } else {
    void bootstrapPremiumModules();
  }
})();
