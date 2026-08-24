// Sürüm adı değişince activate eski önbelleği tamamen siler —
// v1'in "önce önbellek" HTML'i kullanıcıları eski sürüme kilitliyordu.
const CACHE = "payradar-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (!request.url.startsWith(self.location.origin)) return;

  // HTML (sayfa gezinmeleri) ve manifest: ÖNCE AĞ — yeni deploy anında görünür,
  // önbellek yalnızca çevrimdışıyken devreye girer.
  const isNavigation = request.mode === "navigate";
  const isManifest = request.url.endsWith("manifest.webmanifest");
  if (isNavigation || isManifest) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached ?? caches.match("./index.html"))
            .then((cached) => cached ?? Response.error()),
        ),
    );
    return;
  }

  // Diğer varlıklar (hash'li JS/CSS, ikonlar): önce önbellek — içerik adresli
  // oldukları için bayatlamazlar, çevrimdışı çalışmayı bunlar sağlar.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        }),
    ),
  );
});
