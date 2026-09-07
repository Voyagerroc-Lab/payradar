/* İlk boyama öncesi kayıtlı dili uygular: TR dışı kullanıcıların sekme
   başlığı ve metin yönü Türkçe görünüp sonra değişmesin. Depolama anahtar
   adına bağımlı değildir: adında "prefs" geçen JSON kaydında geçerli bir
   language alanı arar. Ayrı dosya olduğu için CSP script-src 'self' ile
   uyumludur; yüklenemeseyse statik Türkçe varsayılan kalır. */
(function () {
  try {
    var n = localStorage.length;
    for (var i = 0; i < n; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf("prefs") === -1) continue;
      var p = {};
      try {
        p = JSON.parse(localStorage.getItem(k) || "{}");
      } catch {
        continue;
      }
      var l = p.language;
      var tags = {
        tr: "Düzenli ödemelerini takip et, gereksizleri iptal et",
        en: "Track recurring payments, cancel what you don't need",
        ms: "Jejak pembayaran berulang anda, batalkan apa yang tidak diperlukan",
        es: "Controla tus pagos recurrentes, cancela lo que no necesitas",
        ar: "تتبّع مدفوعاتك المتكررة وألغِ ما لا تحتاجه",
      };
      if (tags[l]) {
        document.documentElement.lang = l;
        document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
        document.title = "PayRadar — " + tags[l];
      }
      break;
    }
  } catch {
    /* depolama kapalı olabilir; statik varsayılan kalır */
  }
})();
