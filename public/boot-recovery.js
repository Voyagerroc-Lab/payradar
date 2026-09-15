/* Eski Android WebView/service worker bozuk önbelleğe takılırsa, update=1
   bağlantısı verileri silmeden yalnızca uygulama önbelleğini temizler. */
(function () {
  try {
    var params = new URLSearchParams(window.location.search);
    if (!params.has("update") && !params.has("guncelle")) return;
    var tasks = [];
    if ("serviceWorker" in navigator) {
      tasks.push(navigator.serviceWorker.getRegistrations().then(function (regs) {
        return Promise.all(regs.map(function (registration) { return registration.unregister(); }));
      }));
    }
    if ("caches" in window) {
      tasks.push(caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (key) { return caches.delete(key); }));
      }));
    }
    Promise.all(tasks).then(function () {
      window.location.replace(window.location.pathname + window.location.hash);
    });
  } catch {
    /* Eski WebView API'leri yoksa normal React açılışı devam eder. */
  }
})();
