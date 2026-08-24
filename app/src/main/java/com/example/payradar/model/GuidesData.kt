package com.example.payradar.model

object GuidesData {
    val CANCEL_GUIDES: List<CancelGuide> = listOf(
        CancelGuide(
            id = "netflix",
            displayName = "Netflix",
            aliases = listOf("netflix"),
            cancelUrl = "https://www.netflix.com/cancelplan",
            steps = listOf(
                "netflix.com adresine gir ve hesabına giriş yap.",
                "Sağ üstteki profil fotoğrafına tıkla, 'Hesap' sayfasını aç.",
                "'Üyeliği İptal Et' butonuna tıkla.",
                "Ekrandaki adımları onaylayarak iptali tamamla.",
                "Ödediğin dönem sonuna kadar erişimin devam eder."
            ),
            tip = "Mobil uygulamadan değil mutlaka web sitesinden iptal etmelisin.",
            stepsEn = listOf(
                "Go to netflix.com and sign in to your account.",
                "Click your profile icon in the top right and open the 'Account' page.",
                "Click 'Cancel Membership'.",
                "Follow the on-screen steps to confirm the cancellation.",
                "You'll keep access until the end of your current billing period."
            ),
            tipEn = "Cancel from the website — not the mobile app."
        ),
        CancelGuide(
            id = "spotify",
            displayName = "Spotify Premium",
            aliases = listOf("spotify", "spotify premium", "spotify family", "spotify duo", "spotify student"),
            cancelUrl = "https://www.spotify.com/tr/account/subscription/",
            steps = listOf(
                "spotify.com adresinden giriş yap ve 'Hesaba Genel Bakış' sayfasına git.",
                "'Planını Değiştir' bölümüne in.",
                "Sayfanın altındaki 'Spotify Premium'u İptal Et' seçeneğine tıkla.",
                "İptal nedenini seçerek işlemi tamamla.",
                "Ücretsiz plana geçersin; kaydettiğin çalma listelerin silinmez."
            ),
            stepsEn = listOf(
                "Sign in at spotify.com and go to your 'Account Overview' page.",
                "Open the 'Change Plan' section.",
                "Scroll down and select 'Cancel Spotify Premium'.",
                "Choose a cancellation reason to complete the process.",
                "You'll move to the Free plan; your saved playlists won't be deleted."
            )
        ),
        CancelGuide(
            id = "blutv",
            displayName = "BluTV",
            aliases = listOf("blutv", "blu tv", "blutv sinema"),
            cancelUrl = "https://www.blutv.com/hesabim/uyelik-bilgilerim",
            steps = listOf(
                "blutv.com'a gir ve oturum aç.",
                "Profil menüsünden 'Hesabım' > 'Üyelik Bilgilerim' sayfasına git.",
                "'Üyeliği Sonlandır' seçeneğine tıkla.",
                "İptal sebebini seçip onayla."
            ),
            tip = "Aboneliği App Store veya Google Play üzerinden aldıysan iptali mağazanın kendi abonelik sayfasından yapman gerekir."
        ),
        CancelGuide(
            id = "exxen",
            displayName = "Exxen",
            aliases = listOf("exxen", "eksşen"),
            cancelUrl = "https://www.exxen.com",
            steps = listOf(
                "exxen.com'a gir ve üye girişi yap.",
                "'Hesabım' bölümünden 'Üyelik Bilgileri'ne git.",
                "'Otomatik Yenilemeyi Kapat' veya üyeliği iptal seçeneğini kullan.",
                "İşlemi onayla; dönem sonuna kadar erişimin sürer."
            ),
            tip = "Kredi kartıyla alındıysa banka ekstrenden tekrar ücret çekilmediğini kontrol et."
        ),
        CancelGuide(
            id = "tod",
            displayName = "TOD",
            aliases = listOf("tod", "tivibu", "tivibu spor", "tod tv"),
            cancelUrl = "https://web.tod.tv",
            steps = listOf(
                "web.tod.tv adresine gir ve hesabına giriş yap.",
                "'Hesabım' > 'Paketlerim ve Aboneliklerim' bölümüne git.",
                "Aktif paketin yanındaki 'İptal Et' seçeneğini kullan.",
                "Onaylayarak otomatik yenilemeyi durdur."
            ),
            tip = "Türk Telekom veya operatör faturasına ekli bir TOD aboneliğin varsa iptali doğrudan operatörden yapman gerekir."
        ),
        CancelGuide(
            id = "turkcell-tv-plus",
            displayName = "Turkcell TV+",
            aliases = listOf("turkcell tv+", "tv+", "turkcell tv plus", "tvplus"),
            steps = listOf(
                "tvplus.com.tr adresine gir veya TV+ uygulamasını aç.",
                "'Hesabım' > 'Abonelik İşlemleri' sayfasına git.",
                "Aboneliği İptal seçeneğiyle üyeliğini sonlandır."
            ),
            tip = "Faturalı hat üzerinden alınan paketler için Turkcell Müşteri Hizmetleri (532) üzerinden iptal talep edilir."
        ),
        CancelGuide(
            id = "fizy",
            displayName = "Fizy",
            aliases = listOf("fizy", "fizy vip", "turkcell fizy"),
            steps = listOf(
                "fizy.com'a giriş yap ve ayarlarına git.",
                "'Üyelik' bölümünden 'Premium Üyeliği İptal Et'i seç.",
                "Adımları takip ederek iptali tamamla."
            ),
            tip = "Uygulama içi satın alma ile aldıysan Google Play veya App Store abonelik yönetiminden iptal etmelisin."
        ),
        CancelGuide(
            id = "muud",
            displayName = "Muud",
            aliases = listOf("muud", "turk telekom muud"),
            steps = listOf(
                "muud.com.tr adresine giriş yap.",
                "Profil > Ayarlar > Üyelik bilgilerine git.",
                "'Üyeliği İptal Et' seçeneğini kullan."
            ),
            tip = "Türk Telekom faturasına ekli aboneliklerde iptali TT Müşteri Hizmetleri (444 0 365) üzerinden yapabilirsin."
        ),
        CancelGuide(
            id = "youtube-premium",
            displayName = "YouTube Premium",
            aliases = listOf("youtube premium", "youtube music", "youtubepremium", "yt premium"),
            cancelUrl = "https://www.youtube.com/paid_memberships",
            steps = listOf(
                "YouTube'da sağ üstteki profil fotoğrafına tıkla.",
                "'Satın Alınmış Abonelikler' (Paid Memberships) sayfasını aç.",
                "YouTube Premium'un yanındaki 'Üyeliği Yönet' > 'Devam Etme'yı seç.",
                "İptal sebebini belirtip onayla."
            ),
            tip = "Google Play üzerinden ödeme yapıyorsan play.google.com/store/account/subscriptions adresinden de yönetebilirsin.",
            stepsEn = listOf(
                "Click your profile picture in the top right on YouTube.",
                "Open the 'Paid Memberships' page.",
                "Next to YouTube Premium, select 'Manage Membership' > 'Deactivate'.",
                "Pick a reason and confirm the cancellation."
            ),
            tipEn = "If you pay through Google Play, you can also manage it at play.google.com/store/account/subscriptions."
        ),
        CancelGuide(
            id = "apple-subscription",
            displayName = "Apple Abonelikleri (Music, iCloud+, TV+)",
            displayNameEn = "Apple Subscriptions (Music, iCloud+, TV+)",
            aliases = listOf("apple music", "icloud", "icloud+", "apple one", "apple tv+", "app store", "apple arcade"),
            cancelUrl = "https://apps.apple.com/account/subscriptions",
            steps = listOf(
                "iPhone/iPad'de Ayarlar > [Adın] > 'Abonelikler'e gir.",
                "İptal etmek istediğin aboneliği seç.",
                "'Aboneliği İptal Et' butonuna dokun ve onayla."
            ),
            tip = "Mac'te App Store > hesabın > Abonelikler; Windows'ta apps.apple.com/account/subscriptions adresini kullan.",
            stepsEn = listOf(
                "On iPhone/iPad go to Settings > [your name] > 'Subscriptions'.",
                "Select the subscription you want to cancel.",
                "Tap 'Cancel Subscription' and confirm."
            ),
            tipEn = "On Mac: App Store > your account > Subscriptions; on Windows use apps.apple.com/account/subscriptions."
        ),
        CancelGuide(
            id = "google-play",
            displayName = "Google Play Abonelikleri",
            displayNameEn = "Google Play Subscriptions",
            aliases = listOf("google play", "google one", "google storage", "play store"),
            cancelUrl = "https://play.google.com/store/account/subscriptions",
            steps = listOf(
                "play.google.com/store/account/subscriptions adresine git.",
                "İptal etmek istediğin aboneliği seç.",
                "'Aboneliği İptal Et'i seç ve ekrandaki adımları tamamla."
            ),
            stepsEn = listOf(
                "Go to play.google.com/store/account/subscriptions.",
                "Select the subscription you want to cancel.",
                "Choose 'Cancel Subscription' and follow the on-screen steps."
            )
        ),
        CancelGuide(
            id = "prime-video",
            displayName = "Amazon Prime",
            aliases = listOf("amazon prime", "prime video", "prime", "amazon"),
            steps = listOf(
                "amazon.com.tr'de giriş yap, 'Hesabım' > 'Prime Üyeliği'ne git.",
                "'Üyeliği Sonlandır' seçeneğine tıkla.",
                "Amazon'un sunduğu devam seçeneklerini geç ve iptali onayla."
            ),
            tip = "Yalnızca Prime Video için ödediğin ayrı bir abonelik varsa aynı sayfadan sadece video üyeliğini de iptal edebilirsin.",
            stepsEn = listOf(
                "Sign in at amazon.com and go to 'Account' > 'Prime Membership'.",
                "Click 'End Membership'.",
                "Skip past Amazon's retention offers and confirm the cancellation."
            ),
            tipEn = "If you have a separate Prime Video–only subscription, you can cancel just that from the same page."
        ),
        CancelGuide(
            id = "disney-plus",
            displayName = "Disney+",
            aliases = listOf("disney+", "disney plus", "disney"),
            cancelUrl = "https://www.disneyplus.com/account/subscription",
            steps = listOf(
                "disneyplus.com'a gir, profilinden 'Hesap' sayfasını aç.",
                "'Aboneliğin' bölümünde 'İptal Abonelik' bağlantısına tıkla.",
                "Adımları onaylayarak iptali tamamla."
            ),
            tip = "Dönem sonuna kadar erişim devam eder; hesabını tamamen silmek istemiyorsan sadece yenilemeyi durdurman yeterli.",
            stepsEn = listOf(
                "Go to disneyplus.com and open the 'Account' page from your profile.",
                "Under 'Subscription', click 'Cancel Subscription'.",
                "Follow the on-screen steps to confirm."
            ),
            tipEn = "Access continues until the end of the billing period — you don't need to delete your account, just stop the renewal."
        ),
        CancelGuide(
            id = "game-pass",
            displayName = "Xbox Game Pass",
            aliases = listOf("game pass", "xbox game pass", "xbox", "pc game pass", "ultimate"),
            cancelUrl = "https://account.microsoft.com/services",
            steps = listOf(
                "account.microsoft.com/services adresine gir.",
                "Game Pass aboneliğinin altında 'Aboneliği Yönet' seçeneğine tıkla.",
                "'İptal Et'i seç; kalan sürenin iade veya süre uzatma seçeneklerini değerlendir."
            ),
            stepsEn = listOf(
                "Go to account.microsoft.com/services.",
                "Under your Game Pass subscription, click 'Manage'.",
                "Select 'Cancel'; review any refund or time-extension options first."
            )
        ),
        CancelGuide(
            id = "ps-plus",
            displayName = "PlayStation Plus",
            aliases = listOf("playstation plus", "ps plus", "psn", "playstation"),
            steps = listOf(
                "PS5/PS4'te Ayarlar > Kullanıcılar ve Hesaplar > Hesap > Ödeme ve Abonelikler yolunu izle.",
                "'Abonelikler' listesinden PlayStation Plus'ı seç.",
                "'Otomatik Yenilemeyi Kapat' seçeneğini işaretle."
            ),
            tip = "Web üzerinden: store.playstation.com > hesabım > aboneliklerden de kapatabilirsin.",
            stepsEn = listOf(
                "On PS5/PS4 go to Settings > Users and Accounts > Account > Payment and Subscriptions.",
                "Select PlayStation Plus from the 'Subscriptions' list.",
                "Turn off 'Auto-Renewal'."
            ),
            tipEn = "You can also do this on the web at store.playstation.com > your account > subscriptions."
        ),
        CancelGuide(
            id = "canva",
            displayName = "Canva Pro",
            aliases = listOf("canva", "canva pro"),
            steps = listOf(
                "canva.com'a gir ve sağ üstten 'Ayarlar'a tıkla.",
                "'Faturalandırma ve Planlar' bölümünü aç.",
                "Canva Pro'nun yanındaki 'Planı İptal Et'i seç.",
                "İptal nedeni anketini geçirerek onayla."
            ),
            tip = "Dönem başında yıllık ödeme yaptıysan iade politikasını kontrol et.",
            stepsEn = listOf(
                "Go to canva.com and click 'Settings' in the top right.",
                "Open 'Billing & Plans'.",
                "Next to Canva Pro, select 'Cancel Plan'.",
                "Complete the cancellation survey to confirm."
            ),
            tipEn = "If you paid annually at the start of the period, check the refund policy."
        ),
        CancelGuide(
            id = "chatgpt-plus",
            displayName = "ChatGPT Plus",
            aliases = listOf("chatgpt", "chatgpt plus", "openai"),
            steps = listOf(
                "chat.openai.com'a gir ve sol alttan profilini aç.",
                "'My Plan' > 'Manage My Subscription' yolunu izle.",
                "Stripe ödeme portalında 'Cancel Plan' seçeneğini kullan ve onayla."
            ),
            stepsEn = listOf(
                "Go to chat.openai.com and open your profile menu in the bottom left.",
                "Go to 'My Plan' > 'Manage My Subscription'.",
                "In the Stripe billing portal, select 'Cancel Plan' and confirm."
            )
        ),
        CancelGuide(
            id = "bein-connect",
            displayName = "beIN SPORTS Connect",
            aliases = listOf("bein", "bein connect", "bein sports", "beinsports"),
            steps = listOf(
                "beinsports.com.tr/connect adresine giriş yap.",
                "'Hesabım' > 'Abonelik Bilgilerim' sayfasını aç.",
                "Otomatik yenilemeyi kapat veya aboneliği iptal et."
            ),
            tip = "Operatör paketi olarak aldıysan iptali operatör müşteri hizmetlerinden yapman gerekir."
        ),
        CancelGuide(
            id = "dsmart-go",
            displayName = "D-Smart Go",
            aliases = listOf("d-smart", "dsmart", "d smart go", "dsmart go"),
            steps = listOf(
                "dsmartgo.com.tr adresinde hesabına giriş yap.",
                "'Hesabım' bölümünden abonelik bilgilerini aç.",
                "İptal talebini oluştur; gerekiyorsa çağrı merkezini (444 44 76) ara."
            )
        ),
        CancelGuide(
            id = "genel",
            displayName = "Genel Rehber (Bilinmeyen Servis)",
            displayNameEn = "General Guide (Unknown Service)",
            aliases = emptyList(),
            steps = listOf(
                "Servisin web sitesinde 'Hesabım', 'Ayarlar' veya 'Abonelik' sayfasını ara.",
                "'Otomatik Yenileme' seçeneğini kapatmayı dene; çoğu serviste iptal bu kadar basittir.",
                "Bulamazsan sitenin yardım/SSS bölümünde 'iptal' kelimesiyle arama yap.",
                "Uygulama içi satın almadıysan ama ücret kesintisi sürüyorsa bankanıza git; kartın için 'otomatik ödeme talimatı' veya 'abonelik iptali' talebi oluşturun.",
                "Son çare olarak kartı değiştirip eski kartı iptal ettirebilirsin; yeni otomatik ödemeler kesilir."
            ),
            tip = "Banka ekstrende tanımadığın periyodik ödemeleri aylık kontrol etmek, unutulmuş abonelikleri yakalamanın en etkili yoludur.",
            stepsEn = listOf(
                "Look for an 'Account', 'Settings', or 'Subscription' page on the service's website.",
                "Try turning off 'Auto-Renewal' — that's enough to cancel on most services.",
                "Can't find it? Search the site's help/FAQ section for 'cancel'.",
                "If it wasn't an in-app purchase but you're still being charged, contact your bank and ask them to block the recurring charge on your card.",
                "As a last resort, replace your card — new recurring charges will then be declined."
            ),
            tipEn = "Checking your bank statement each month for unrecognized recurring charges is the most effective way to catch forgotten subscriptions."
        )
    )

    fun normalizeName(name: String): String {
        return name.lowercase()
            .replace('ı', 'i')
            .replace('ş', 's')
            .replace('ğ', 'g')
            .replace('ü', 'u')
            .replace('ö', 'o')
            .replace('ç', 'c')
            .replace(Regex("\\s+"), " ")
            .trim()
    }

    fun findGuide(name: String): CancelGuide? {
        val normalized = normalizeName(name)
        if (normalized.isEmpty()) return null
        for (guide in CANCEL_GUIDES) {
            for (alias in guide.aliases) {
                val nAlias = normalizeName(alias)
                if (normalized == nAlias || normalized.contains(nAlias) || nAlias.contains(normalized)) {
                    return guide
                }
            }
        }
        return null
    }

    fun getGuideOrGeneric(name: String, lang: AppLanguage): CancelGuide {
        val guide = findGuide(name) ?: CANCEL_GUIDES.first { it.id == "genel" }
        return if (lang == AppLanguage.EN) {
            guide.copy(
                displayName = guide.displayNameEn ?: guide.displayName,
                steps = guide.stepsEn ?: guide.steps,
                tip = guide.tipEn ?: guide.tip
            )
        } else {
            guide
        }
    }
}
