// Sürüm adı değişince activate eski önbelleği tamamen siler.
// v2 → v3: v2, başarısız yanıtları (deploy geçişi sırasındaki 404'ler dahil)
// önbelleğe alabiliyordu; "önce önbellek" varlıklar bir daha sorgulanmadığı
// için cihaz kalıcı boş ekranda kalıyordu. v3 hem bunu düzeltir hem de
// sürüm terfisiyle zehirlenmiş eski önbellekleri her cihazda temizler.
// v3 → v4: 1 Eyl 2026 arayüz düzeltmeleri; ad değişince her cihazda eski
// hash'li varlık önbelleği activate'te temizlenir (deploy sonrası tortu kalmaz).
const CACHE = "payradar-v4";

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

/** Yalnızca başarılı yanıtlar önbelleğe yazılır; hata sayfasını saklamak
 *  çevrimdışı desteği değil kalıcı bir arıza üretir. */
function cacheIfOk(request, response) {
  if (response.ok) {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
}

/* SW üzerinden gösterilen bildirime tıklanınca uygulamayı odakla ya da aç */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ("focus" in client) return client.focus();
        }
        return self.clients.openWindow("./");
      }),
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
        .then((response) => cacheIfOk(request, response))
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
  // Önbellekteki kayıt da yalnızca başarılıysa kullanılır (eski zehirli
  // kayıtlara karşı ikinci emniyet).
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached && cached.ok) return cached;
      return fetch(request).then((response) => cacheIfOk(request, response));
    }),
  );
});
