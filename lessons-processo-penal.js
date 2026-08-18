(() => {
  "use strict";

  // As aulas de Processo Penal Premium são carregadas do Firestore.
  // Este arquivo também garante que os módulos da área Estudar sejam
  // carregados na página principal, mesmo após atualizações do layout.
  const scripts = [
    ["premium-library.js?v=2", "premiumLibraryLoader"],
    ["premium-home-bridge.js?v=2", "premiumHomeBridgeLoader"]
  ];

  scripts.forEach(([src, marker]) => {
    if (document.querySelector(`script[data-${marker}]`)) return;
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.dataset[marker] = "true";
    document.head.appendChild(script);
  });
})();
