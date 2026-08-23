import type { CancelGuide } from "../types";

/**
 * Popüler servisler için adım adım iptal rehberleri.
 * Not: Servisler arayüzlerini değiştirebilir; rehberler genel akışı gösterir.
 */
export const CANCEL_GUIDES: CancelGuide[] = [
  {
    id: "netflix",
    displayName: "Netflix",
    aliases: ["netflix"],
    cancelUrl: "https://www.netflix.com/cancelplan",
    steps: [
      "netflix.com adresine gir ve hesabına giriş yap.",
      "Sağ üstteki profil fotoğrafına tıkla, 'Hesap' sayfasını aç.",
      "'Üyeliği İptal Et' butonuna tıkla.",
      "Ekrandaki adımları onaylayarak iptali tamamla.",
      "Ödediğin dönem sonuna kadar erişimin devam eder.",
    ],
    tip: "Mobil uygulamadan değil mutlaka web sitesinden iptal etmelisin.",
  },
  {
    id: "spotify",
    displayName: "Spotify Premium",
    aliases: ["spotify", "spotify premium", "spotify family", "spotify duo", "spotify student"],
    cancelUrl: "https://www.spotify.com/tr/account/subscription/",
    steps: [
      "spotify.com adresinden giriş yap ve 'Hesaba Genel Bakış' sayfasına git.",
      "'Planını Değiştir' bölümüne in.",
      "Sayfanın altındaki 'Spotify Premium'u İptal Et' seçeneğine tıkla.",
      "İptal nedenini seçerek işlemi tamamla.",
      "Ücretsiz plana geçersin; kaydettiğin çalma listelerin silinmez.",
    ],
  },
  {
    id: "blutv",
    displayName: "BluTV",
    aliases: ["blutv", "blu tv", "blutv sinema"],
    cancelUrl: "https://www.blutv.com/hesabim/uyelik-bilgilerim",
    steps: [
      "blutv.com'a gir ve oturum aç.",
      "Profil menüsünden 'Hesabım' > 'Üyelik Bilgilerim' sayfasına git.",
      "'Üyeliği Sonlandır' seçeneğine tıkla.",
      "İptal sebebini seçip onayla.",
    ],
    tip: "Aboneliği App Store veya Google Play üzerinden aldıysan iptali mağazanın kendi abonelik sayfasından yapman gerekir.",
  },
  {
    id: "exxen",
    displayName: "Exxen",
    aliases: ["exxen", "eksşen"],
    cancelUrl: "https://www.exxen.com",
    steps: [
      "exxen.com'a gir ve üye girişi yap.",
      "'Hesabım' bölümünden 'Üyelik Bilgileri'ne git.",
      "'Otomatik Yenilemeyi Kapat' veya üyeliği iptal seçeneğini kullan.",
      "İşlemi onayla; dönem sonuna kadar erişimin sürer.",
    ],
    tip: "Kredi kartıyla alındıysa banka ekstrenden tekrar ücret çekilmediğini kontrol et.",
  },
  {
    id: "tod",
    displayName: "TOD",
    aliases: ["tod", "tivibu", "tivibu spor", "tod tv"],
    cancelUrl: "https://web.tod.tv",
    steps: [
      "web.tod.tv adresine gir ve hesabına giriş yap.",
      "'Hesabım' > 'Paketlerim ve Aboneliklerim' bölümüne git.",
      "Aktif paketin yanındaki 'İptal Et' seçeneğini kullan.",
      "Onaylayarak otomatik yenilemeyi durdur.",
    ],
    tip: "Türk Telekom veya operatör faturasına ekli bir TOD aboneliğin varsa iptali doğrudan operatörden yapman gerekir.",
  },
  {
    id: "turkcell-tv-plus",
    displayName: "Turkcell TV+",
    aliases: ["turkcell tv+", "tv+", "turkcell tv plus", "tvplus"],
    steps: [
      "tvplus.com.tr adresine gir veya TV+ uygulamasını aç.",
      "'Hesabım' > 'Abonelik İşlemleri' sayfasına git.",
      "Aboneliği İptal seçeneğiyle üyeliğini sonlandır.",
    ],
    tip: "Faturalı hat üzerinden alınan paketler için Turkcell Müşteri Hizmetleri (532) üzerinden iptal talep edilir.",
  },
  {
    id: "fizy",
    displayName: "Fizy",
    aliases: ["fizy", "fizy vip", "turkcell fizy"],
    steps: [
      "fizy.com'a giriş yap ve ayarlarına git.",
      "'Üyelik' bölümünden 'Premium Üyeliği İptal Et'i seç.",
      "Adımları takip ederek iptali tamamla.",
    ],
    tip: "Uygulama içi satın alma ile aldıysan Google Play veya App Store abonelik yönetiminden iptal etmelisin.",
  },
  {
    id: "muud",
    displayName: "Muud",
    aliases: ["muud", "turk telekom muud"],
    steps: [
      "muud.com.tr adresine giriş yap.",
      "Profil > Ayarlar > Üyelik bilgilerine git.",
      "'Üyeliği İptal Et' seçeneğini kullan.",
    ],
    tip: "Türk Telekom faturasına ekli aboneliklerde iptali TT Müşteri Hizmetleri (444 0 365) üzerinden yapabilirsin.",
  },
  {
    id: "youtube-premium",
    displayName: "YouTube Premium",
    aliases: ["youtube premium", "youtube music", "youtubepremium", "yt premium"],
    cancelUrl: "https://www.youtube.com/paid_memberships",
    steps: [
      "YouTube'da sağ üstteki profil fotoğrafına tıkla.",
      "'Satın Alınmış Abonelikler' (Paid Memberships) sayfasını aç.",
      "YouTube Premium'un yanındaki 'Üyeliği Yönet' > 'Devam Etme'yı seç.",
      "İptal sebebini belirtip onayla.",
    ],
    tip: "Google Play üzerinden ödeme yapıyorsan play.google.com/store/account/subscriptions adresinden de yönetebilirsin.",
  },
  {
    id: "apple-subscription",
    displayName: "Apple Abonelikleri (Music, iCloud+, TV+)",
    aliases: [
      "apple music",
      "icloud",
      "icloud+",
      "apple one",
      "apple tv+",
      "app store",
      "apple arcade",
    ],
    cancelUrl: "https://apps.apple.com/account/subscriptions",
    steps: [
      "iPhone/iPad'de Ayarlar > [Adın] > 'Abonelikler'e gir.",
      "İptal etmek istediğin aboneliği seç.",
      "'Aboneliği İptal Et' butonuna dokun ve onayla.",
    ],
    tip: "Mac'te App Store > hesabın > Abonelikler; Windows'ta apps.apple.com/account/subscriptions adresini kullan.",
  },
  {
    id: "google-play",
    displayName: "Google Play Abonelikleri",
    aliases: ["google play", "google one", "google storage", "play store"],
    cancelUrl: "https://play.google.com/store/account/subscriptions",
    steps: [
      "play.google.com/store/account/subscriptions adresine git.",
      "İptal etmek istediğin aboneliği seç.",
      "'Aboneliği İptal Et'i seç ve ekrandaki adımları tamamla.",
    ],
  },
  {
    id: "prime-video",
    displayName: "Amazon Prime",
    aliases: ["amazon prime", "prime video", "prime", "amazon"],
    steps: [
      "amazon.com.tr'de giriş yap, 'Hesabım' > 'Prime Üyeliği'ne git.",
      "'Üyeliği Sonlandır' seçeneğine tıkla.",
      "Amazon'un sunduğu devam seçeneklerini geç ve iptali onayla.",
    ],
    tip: "Yalnızca Prime Video için ödediğin ayrı bir abonelik varsa aynı sayfadan sadece video üyeliğini de iptal edebilirsin.",
  },
  {
    id: "disney-plus",
    displayName: "Disney+",
    aliases: ["disney+", "disney plus", "disney"],
    cancelUrl: "https://www.disneyplus.com/account/subscription",
    steps: [
      "disneyplus.com'a gir, profilinden 'Hesap' sayfasını aç.",
      "'Aboneliğin' bölümünde 'İptal Abonelik' bağlantısına tıkla.",
      "Adımları onaylayarak iptali tamamla.",
    ],
    tip: "Dönem sonuna kadar erişim devam eder; hesabını tamamen silmek istemiyorsan sadece yenilemeyi durdurman yeterli.",
  },
  {
    id: "game-pass",
    displayName: "Xbox Game Pass",
    aliases: ["game pass", "xbox game pass", "xbox", "pc game pass", "ultimate"],
    cancelUrl: "https://account.microsoft.com/services",
    steps: [
      "account.microsoft.com/services adresine gir.",
      "Game Pass aboneliğinin altında 'Aboneliği Yönet' seçeneğine tıkla.",
      "'İptal Et'i seç; kalan sürenin iade veya süre uzatma seçeneklerini değerlendir.",
    ],
  },
  {
    id: "ps-plus",
    displayName: "PlayStation Plus",
    aliases: ["playstation plus", "ps plus", "psn", "playstation"],
    steps: [
      "PS5/PS4'te Ayarlar > Kullanıcılar ve Hesaplar > Hesap > Ödeme ve Abonelikler yolunu izle.",
      "'Abonelikler' listesinden PlayStation Plus'ı seç.",
      "'Otomatik Yenilemeyi Kapat' seçeneğini işaretle.",
    ],
    tip: "Web üzerinden: store.playstation.com > hesabım > aboneliklerden de kapatabilirsin.",
  },
  {
    id: "canva",
    displayName: "Canva Pro",
    aliases: ["canva", "canva pro"],
    steps: [
      "canva.com'a gir ve sağ üstten 'Ayarlar'a tıkla.",
      "'Faturalandırma ve Planlar' bölümünü aç.",
      "Canva Pro'nun yanındaki 'Planı İptal Et'i seç.",
      "İptal nedeni anketini geçirerek onayla.",
    ],
    tip: "Dönem başında yıllık ödeme yaptıysan iade politikasını kontrol et.",
  },
  {
    id: "chatgpt-plus",
    displayName: "ChatGPT Plus",
    aliases: ["chatgpt", "chatgpt plus", "openai"],
    steps: [
      "chat.openai.com'a gir ve sol alttan profilini aç.",
      "'My Plan' > 'Manage My Subscription' yolunu izle.",
      "Stripe ödeme portalında 'Cancel Plan' seçeneğini kullan ve onayla.",
    ],
  },
  {
    id: "bein-connect",
    displayName: "beIN SPORTS Connect",
    aliases: ["bein", "bein connect", "bein sports", "beinsports"],
    steps: [
      "beinsports.com.tr/connect adresine giriş yap.",
      "'Hesabım' > 'Abonelik Bilgilerim' sayfasını aç.",
      "Otomatik yenilemeyi kapat veya aboneliği iptal et.",
    ],
    tip: "Operatör paketi olarak aldıysan iptali operatör müşteri hizmetlerinden yapman gerekir.",
  },
  {
    id: "dsmart-go",
    displayName: "D-Smart Go",
    aliases: ["d-smart", "dsmart", "d smart go", "dsmart go"],
    steps: [
      "dsmartgo.com.tr adresinde hesabına giriş yap.",
      "'Hesabım' bölümünden abonelik bilgilerini aç.",
      "İptal talebini oluştur; gerekiyorsa çağrı merkezini (444 44 76) ara.",
    ],
  },
  {
    id: "genel",
    displayName: "Genel Rehber (Bilinmeyen Servis)",
    aliases: [],
    steps: [
      "Servisin web sitesinde 'Hesabım', 'Ayarlar' veya 'Abonelik' sayfasını ara.",
      "'Otomatik Yenileme' seçeneğini kapatmayı dene; çoğu serviste iptal bu kadar basittir.",
      "Bulamazsan sitenin yardım/SSS bölümünde 'iptal' kelimesiyle arama yap.",
      "Uygulama içi satın almadıysan ama ücret kesintisi sürüyorsa bankanıza git; kartın için 'otomatik ödeme talimatı' veya 'abonelik iptali' talebi oluşturun.",
      "Son çare olarak kartı değiştirip eski kartı iptal ettirebilirsin; yeni otomatik ödemeler kesilir.",
    ],
    tip: "Banka ekstrende tanımadığın periyodik ödemeleri aylık kontrol etmek, unutulmuş abonelikleri yakalamanın en etkili yoludur.",
  },
];

export function normalizeName(name: string): string {
  return name
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim();
}

export function findGuide(name: string): CancelGuide | null {
  const normalized = normalizeName(name);
  if (!normalized) return null;
  for (const guide of CANCEL_GUIDES) {
    for (const alias of guide.aliases) {
      const nAlias = normalizeName(alias);
      if (normalized === nAlias || normalized.includes(nAlias) || nAlias.includes(normalized)) {
        return guide;
      }
    }
  }
  return null;
}

/** Eşleşme yoksa genel rehberi döndürür. */
export function getGuideOrGeneric(name: string): CancelGuide {
  return findGuide(name) ?? CANCEL_GUIDES.find((g) => g.id === "genel")!;
}
