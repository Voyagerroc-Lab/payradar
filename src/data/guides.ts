import type { CancelGuide, Language } from "../types";

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
    stepsEn: [
      "Go to netflix.com and sign in to your account.",
      "Click your profile icon in the top right and open the 'Account' page.",
      "Click 'Cancel Membership'.",
      "Follow the on-screen steps to confirm the cancellation.",
      "You'll keep access until the end of your current billing period.",
    ],
    tipEn: "Cancel from the website — not the mobile app.",
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
    stepsEn: [
      "Sign in at spotify.com and go to your 'Account Overview' page.",
      "Open the 'Change Plan' section.",
      "Scroll down and select 'Cancel Spotify Premium'.",
      "Choose a cancellation reason to complete the process.",
      "You'll move to the Free plan; your saved playlists won't be deleted.",
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
      "'Aboneliği İptal Et' seçeneğiyle üyeliğini sonlandır.",
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
      "'Ücretli Üyelikler' (Paid Memberships) sayfasını aç.",
      "YouTube Premium'un yanındaki 'Üyeliği Yönet' > 'Devam Etme'yi seç.",
      "İptal sebebini belirtip onayla.",
    ],
    tip: "Google Play üzerinden ödeme yapıyorsan play.google.com/store/account/subscriptions adresinden de yönetebilirsin.",
    stepsEn: [
      "Click your profile picture in the top right on YouTube.",
      "Open the 'Paid Memberships' page.",
      "Next to YouTube Premium, select 'Manage Membership' > 'Deactivate'.",
      "Pick a reason and confirm the cancellation.",
    ],
    tipEn: "If you pay through Google Play, you can also manage it at play.google.com/store/account/subscriptions.",
  },
  {
    id: "apple-subscription",
    displayName: "Apple Abonelikleri (Music, iCloud+, TV+)",
    displayNameEn: "Apple Subscriptions (Music, iCloud+, TV+)",
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
    stepsEn: [
      "On iPhone/iPad go to Settings > [your name] > 'Subscriptions'.",
      "Select the subscription you want to cancel.",
      "Tap 'Cancel Subscription' and confirm.",
    ],
    tipEn: "On Mac: App Store > your account > Subscriptions; on Windows use apps.apple.com/account/subscriptions.",
  },
  {
    id: "google-play",
    displayName: "Google Play Abonelikleri",
    displayNameEn: "Google Play Subscriptions",
    aliases: ["google play", "google one", "google storage", "play store"],
    cancelUrl: "https://play.google.com/store/account/subscriptions",
    steps: [
      "play.google.com/store/account/subscriptions adresine git.",
      "İptal etmek istediğin aboneliği seç.",
      "'Aboneliği İptal Et'i seç ve ekrandaki adımları tamamla.",
    ],
    stepsEn: [
      "Go to play.google.com/store/account/subscriptions.",
      "Select the subscription you want to cancel.",
      "Choose 'Cancel Subscription' and follow the on-screen steps.",
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
    stepsEn: [
      "Sign in at amazon.com and go to 'Account' > 'Prime Membership'.",
      "Click 'End Membership'.",
      "Skip past Amazon's retention offers and confirm the cancellation.",
    ],
    tipEn: "If you have a separate Prime Video–only subscription, you can cancel just that from the same page.",
  },
  {
    id: "disney-plus",
    displayName: "Disney+",
    aliases: ["disney+", "disney plus", "disney"],
    cancelUrl: "https://www.disneyplus.com/account/subscription",
    steps: [
      "disneyplus.com'a gir, profilinden 'Hesap' sayfasını aç.",
      "'Aboneliğin' bölümünde 'Aboneliği İptal Et' bağlantısına tıkla.",
      "Adımları onaylayarak iptali tamamla.",
    ],
    tip: "Dönem sonuna kadar erişim devam eder; hesabını tamamen silmek istemiyorsan sadece yenilemeyi durdurman yeterli.",
    stepsEn: [
      "Go to disneyplus.com and open the 'Account' page from your profile.",
      "Under 'Subscription', click 'Cancel Subscription'.",
      "Follow the on-screen steps to confirm.",
    ],
    tipEn: "Access continues until the end of the billing period — you don't need to delete your account, just stop the renewal.",
  },
  {
    id: "game-pass",
    displayName: "Xbox Game Pass",
    aliases: ["game pass", "xbox game pass", "xbox", "pc game pass", "ultimate"],
    cancelUrl: "https://account.microsoft.com/services",
    steps: [
      "account.microsoft.com/services adresine gir.",
      "Game Pass aboneliğinin altında 'Aboneliği Yönet' seçeneğine tıkla.",
      "'İptal Et'i seç; iade veya süre uzatma seçeneklerini önce gözden geçir.",
    ],
    stepsEn: [
      "Go to account.microsoft.com/services.",
      "Under your Game Pass subscription, click 'Manage'.",
      "Select 'Cancel'; review any refund or time-extension options first.",
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
    stepsEn: [
      "On PS5/PS4 go to Settings > Users and Accounts > Account > Payment and Subscriptions.",
      "Select PlayStation Plus from the 'Subscriptions' list.",
      "Turn off 'Auto-Renewal'.",
    ],
    tipEn: "You can also do this on the web at store.playstation.com > your account > subscriptions.",
  },
  {
    id: "canva",
    displayName: "Canva Pro",
    aliases: ["canva", "canva pro"],
    steps: [
      "canva.com'a gir ve sağ üstten 'Ayarlar'a tıkla.",
      "'Faturalandırma ve Planlar' bölümünü aç.",
      "Canva Pro'nun yanındaki 'Planı İptal Et'i seç.",
      "İptal nedeni anketini geçip onayla.",
    ],
    tip: "Dönem başında yıllık ödeme yaptıysan iade politikasını kontrol et.",
    stepsEn: [
      "Go to canva.com and click 'Settings' in the top right.",
      "Open 'Billing & Plans'.",
      "Next to Canva Pro, select 'Cancel Plan'.",
      "Complete the cancellation survey to confirm.",
    ],
    tipEn: "If you paid annually at the start of the period, check the refund policy.",
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
    stepsEn: [
      "Go to chat.openai.com and open your profile menu in the bottom left.",
      "Go to 'My Plan' > 'Manage My Subscription'.",
      "In the Stripe billing portal, select 'Cancel Plan' and confirm.",
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
    displayNameEn: "General Guide (Unknown Service)",
    aliases: [],
    steps: [
      "Servisin web sitesinde 'Hesabım', 'Ayarlar' veya 'Abonelik' sayfasını ara.",
      "'Otomatik Yenileme' seçeneğini kapatmayı dene; çoğu serviste iptal bu kadar basittir.",
      "Bulamazsan sitenin yardım/SSS bölümünde 'iptal' kelimesiyle arama yap.",
      "Uygulama içinden satın almadıysan ama ücret kesintisi sürüyorsa bankana başvur; karttaki tekrarlayan ödemenin engellenmesini (otomatik ödeme talimatı iptali) iste.",
      "Son çare olarak kartı değiştirip eski kartı iptal ettirebilirsin; yeni otomatik ödemeler kesilir.",
    ],
    tip: "Banka ekstrende tanımadığın periyodik ödemeleri aylık kontrol etmek, unutulmuş abonelikleri yakalamanın en etkili yoludur.",
    stepsEn: [
      "Look for an 'Account', 'Settings', or 'Subscription' page on the service's website.",
      "Try turning off 'Auto-Renewal' — that's enough to cancel on most services.",
      "Can't find it? Search the site's help/FAQ section for 'cancel'.",
      "If it wasn't an in-app purchase but you're still being charged, contact your bank and ask them to block the recurring charge on your card.",
      "As a last resort, replace your card — new recurring charges will then be declined.",
    ],
    tipEn: "Checking your bank statement each month for unrecognized recurring charges is the most effective way to catch forgotten subscriptions.",
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

/** Türkçe arayüz Türkçe adımları görür; diğer tüm diller (en/ms/es/ar) varsa
 *  İngilizce alanları kullanır, yoksa Türkçesine düşer. */
function resolveGuideLanguage(guide: CancelGuide, lang: Language): CancelGuide {
  if (lang === "tr") return guide;
  return {
    ...guide,
    displayName: guide.displayNameEn ?? guide.displayName,
    steps: guide.stepsEn ?? guide.steps,
    tip: guide.tipEn ?? guide.tip,
  };
}

/** Eşleşme yoksa genel rehberi döndürür. */
export function getGuideOrGeneric(name: string, lang: Language): CancelGuide {
  const guide = findGuide(name) ?? CANCEL_GUIDES.find((g) => g.id === "genel")!;
  return resolveGuideLanguage(guide, lang);
}
