(() => {
  "use strict";

  function cleanup() {
    document.querySelectorAll(".study-content-test").forEach(node => node.remove());

    const premiumStyles = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .filter(link => String(link.getAttribute("href") || "").startsWith("premium-ui.css"));
    premiumStyles.slice(1).forEach(link => link.remove());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cleanup, { once: true });
  } else {
    cleanup();
  }
})();
