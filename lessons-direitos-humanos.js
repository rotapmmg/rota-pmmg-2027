"use strict";

window.PMMG_LESSONS = window.PMMG_LESSONS || {};

[
  "lessons-direitos-humanos-01.js",
  "lessons-direitos-humanos-02.js",
  "lessons-direitos-humanos-03.js",
  "lessons-direitos-humanos-04.js",
  "lessons-direitos-humanos-05.js"
].forEach((file) => {
  const request = new XMLHttpRequest();
  request.open("GET", file, false);
  request.send(null);

  if (request.status >= 200 && request.status < 300) {
    (0, eval)(`${request.responseText}\n//# sourceURL=${file}`);
    return;
  }

  throw new Error(`Falha ao carregar ${file}: HTTP ${request.status}`);
});
