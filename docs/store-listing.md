# PayRadar — Mağaza Yayın Kiti

Play Console (ve ileride App Store Connect) formlarına kopyala-yapıştır için hazırlanmıştır.

---

## Google Play — Türkçe (varsayılan dil: tr-TR)

**Uygulama adı** (maks. 30 karakter):
```
PayRadar: Ödeme Takibi
```

**Kısa açıklama** (maks. 80 karakter):
```
Kira, kredi, fatura ve abonelikleri tek yerde takip et. Reklamsız, izlemesiz.
```

**Tam açıklama** (maks. 4000 karakter):
```
Netflix'ten ev kirasına, banka kredisi taksitinden çek vadesine kadar tüm düzenli ödemelerinizi tek ekranda görün. PayRadar tamamen ücretsiz ve açık kaynaklıdır — reklam yok, izleme yok.

📊 ANINDA GENEL BAKIŞ
• Aylık toplam, yıllık tahmin, aktif ödeme sayısı ve en yakın ödeme tek bakışta
• Her kartta renkli geri sayım rozeti: bugün mü, 3 gün sonra mı, gecikti mi?

🏦 HER TÜR DÜZENLİ ÖDEME — 11 KATEGORİ
• Kira & konut, araç & ulaşım, faturalar, abonelikler
• Banka kredisi taksitleri (banka adı + 14/60 taksit sayacı ile)
• Çek & senet vadeleri (seri no ve alacaklı firma bilgisiyle)
• Eğitim, sağlık & spor, sigorta, oyun ve diğerleri

🔔 AKILLI HATIRLATMALAR
• Vadeden 1-7 gün önce bildirim; 2 güne kadar gecikme uyarısı
• Birden fazla ödeme yaklaşırken tek özet bildirimi ve toplam tutar
• "Ödendi" tuşuyla vadeyi bir sonraki döneme tek dokunuşla atla

🎁 DENEME SÜRESİ TAKİBİ
• Ücretsiz denemeleri işaretleyin, kartınızdan ücret çekilmeden önce uyarı alın

🚫 İPTAL REHBERLERİ
• Netflix, Spotify, YouTube Premium, Disney+, Game Pass ve 15+ servis için adım adım iptal rehberi ve doğrudan iptal bağlantıları

📈 FİYAT GEÇMİŞİ
• Zam geldiğinde eski fiyat otomatik kaydedilir; artışı grafikte görün

🔒 GİZLİLİK ÖNCE GELİR
• Verileriniz varsayılan olarak yalnızca cihazınızda durur
• İsteğe bağlı PIN kilidi: AES-256 ile cihazda şifreleme, otomatik kilitlenme
• İsteğe bağlı ücretsiz bulut senkronu: e-posta, telefon veya Google ile giriş yapın, verileriniz tüm cihazlarınızda buluşsun
• Reklam SDK'sı yok, analitik yok, veri satışı yok — kod tamamen açık kaynak

🌍 DİĞER
• Türkçe, İngilizce ve Malayca arayüz
• TRY / USD / EUR desteği, düzenlenebilir kurlar
• CSV içe/dışa aktarma (Excel uyumlu)
• Karanlık mod, çevrimdışı çalışma

Açık kaynak: github.com/Voyagerroc/payradar
```

---

## Google Play — English (en-US)

**App name** (max 30):
```
PayRadar: Payment Tracker
```

**Short description** (max 80):
```
Track rent, loans, bills & subscriptions in one place. No ads, no tracking.
```

**Full description** (max 4000):
```
See every recurring payment on one screen — from Netflix to rent, from bank loan installments to check due dates. PayRadar is completely free and open source: no ads, no tracking.

📊 INSTANT OVERVIEW
• Monthly total, yearly estimate, active payment count and next due date at a glance
• Color-coded countdown badge on every card: due today, in 3 days, or overdue

🏦 EVERY KIND OF RECURRING PAYMENT — 11 CATEGORIES
• Rent & housing, car & transport, utilities, subscriptions
• Bank loan installments (with bank name and a 14/60 installment counter)
• Check & promissory note due dates (with serial number and payee)
• Education, health & fitness, insurance, gaming and more

🔔 SMART REMINDERS
• Notifications 1–7 days before a due date, plus overdue alerts up to 2 days
• A single digest notification with the total when several payments are coming up
• One-tap "Paid" advances the due date to the next cycle

🎁 FREE-TRIAL TRACKING
• Mark free trials and get warned before your card is charged

🚫 CANCELLATION GUIDES
• Step-by-step cancel guides with direct links for Netflix, Spotify, YouTube Premium, Disney+, Game Pass and 15+ more services

📈 PRICE HISTORY
• Old prices are recorded automatically when a hike lands; see the increase on a chart

🔒 PRIVACY FIRST
• Your data stays on your device by default
• Optional PIN lock: on-device AES-256 encryption with auto-lock
• Optional free cloud sync: sign in with email, phone or Google and keep every device in sync
• No ad SDKs, no analytics, no data sales — fully open source

🌍 MORE
• Turkish, English and Malay interface
• TRY / USD / EUR with editable exchange rates
• CSV import/export (Excel-friendly)
• Dark mode, works offline

Open source: github.com/Voyagerroc/payradar
```

---

## Ortak alanlar

- **Kategori:** Finance (Finans)
- **E-posta:** tascierol24@gmail.com
- **Gizlilik politikası URL'si:** https://payradar-pink.vercel.app/privacy.html
- **Web sitesi:** https://payradar-pink.vercel.app
- **İçerik derecelendirmesi anketi:** şiddet/kumar/vb. hiçbiri yok → "Herkes / Everyone" çıkar
- **Hedef kitle:** 18+ önerilir (finans uygulaması; çocuklara yönelik değil)
- **Reklam içerir mi?:** Hayır
- **Uygulama içi satın alma:** Yok

## Play Console → Data Safety formu cevapları

| Soru | Cevap |
|---|---|
| Veri topluyor veya paylaşıyor mu? | **Evet, isteğe bağlı** (yalnızca kullanıcı bulut senkronu hesabı açarsa) |
| Toplanan veri türleri | Kişisel bilgiler → **E-posta adresi** (isteğe bağlı: telefon numarası, ad); Finansal bilgiler → **Kullanıcı ödeme kayıtları** (tutar/tarih/ad — kart numarası DEĞİL) |
| Veri şifreli aktarılıyor mu? | **Evet** (HTTPS/TLS) |
| Kullanıcı veri silme talep edebilir mi? | **Evet** (uygulama içi tam silme + e-posta ile bulut hesabı silme) |
| Üçüncü taraflarla paylaşım | **Hayır** |
| Reklam amaçlı veri | **Hayır** |
| Veri toplama zorunlu mu? | **Hayır — isteğe bağlı** (uygulama hesapsız tamamen çalışır) |

## Görseller (assets/store/ klasöründe)

- `feature-graphic.png` — 1024×500 (Play Store tanıtım grafiği)
- `phone-1..5.png` — 1179×2556 telefon ekran görüntüleri (TR arayüz)
- Uygulama ikonu: Play Console `PayRadar - Google Play package.zip` içindeki AAB'den otomatik alınır; ayrıca 512×512 gerekirse `public/icon-512.png` kullanılabilir.
