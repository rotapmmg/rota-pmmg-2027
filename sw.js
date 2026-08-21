const CACHE = "rota-pmmg-v35";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./questions-center.css?v=2",
  "./premium-ui.css?v=1",
  "./app.js",
  "./questions-center.js?v=2",
  "./premium-ui.js?v=1",
  "./lessons.js",
  "./lessons-portugueses-extra.js",
  "./lessons-constitucional.js",
  "./lessons-administrativo.js",
  "./lessons-penal.js",
  "./lessons-processo-penal.js",
  "./lessons-processo-penal-01.js",
  "./lessons-processo-penal-02.js",
  "./lessons-processo-penal-03.js",
  "./lessons-processo-penal-04.js",
  "./lessons-processo-penal-05.js",
  "./lessons-processo-penal-06.js",
  "./lessons-direitos-humanos.js",
  "./lessons-direitos-humanos-01.js",
  "./lessons-direitos-humanos-02.js",
  "./lessons-direitos-humanos-03.js",
  "./lessons-direitos-humanos-04.js",
  "./lessons-direitos-humanos-05.js",
  "./lessons-matematica.js?v=3",
  "./lessons-ingles.js?v=1",
  "./lessons-literatura.js?v=1",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();

        caches.open(CACHE).then((cache) => {
          cache.put(event.request, copy);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
