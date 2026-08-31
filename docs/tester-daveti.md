# Testçi Daveti — Standart Akış

Bu dosya, PayRadar (ve Voyagerroc'un diğer uygulamaları) için testçi davetlerinde
kullanılacak **tek doğru bağlantı biçimini** ve hazır mail şablonunu tutar.
Yeni davet gönderirken buradaki bağlantıyı kopyala; başka bir biçim kullanma.

---

## 1. Kullanılacak bağlantı

```
https://play.google.com/apps/testing/com.payradar.app
```

Genel kalıp: `https://play.google.com/apps/testing/<paket.adı>`

| Uygulama | Paket adı | Web opt-in bağlantısı |
|---|---|---|
| PayRadar | `com.payradar.app` | https://play.google.com/apps/testing/com.payradar.app |
| Tabela | `com.voyagerroc.tabela` | https://play.google.com/apps/testing/com.voyagerroc.tabela |
| LaserDeck PTT | `com.voyagerroc.laserdeck.ptt` | *(kapalı test yayınlanınca aktifleşir)* |
| EİP | `com.voyagerroc.eip` | *(kapalı test yayınlanınca aktifleşir)* |

Konsoldan doğrulama yolu: uygulama → **Test and release → Testing → Closed testing →
(track) → Testers** sekmesi → en altta **"How testers join your test" → "Join on the web" →
Copy link**.

## 2. Neden bu bağlantı

Bu sayfa Google Play markalı, profesyonel bir karşılama ekranı:

- Uygulama ikonu, adı ve geliştirici adı (**Voyagerroc Technologies**) görünür
- Kişiye testçi olup olmadığını söyler
- Testçi değilse ortada **"Become a tester"** düğmesi vardır
- Testçi olduktan **sonra** "Download it on Google Play" bağlantısı belirir
- Sayfaya girer girmez indirme **başlatmaz**

## 3. Kullanılmayacak bağlantılar

| Bağlantı | Neden olmaz |
|---|---|
| `play.google.com/apps/internaltest/<sayı>` | İç test izine ait; sade görünüyor, "Become a tester" yerine doğrudan **"Download test app"** düğmesi çıkıyor. Ayrıca 12×14 kuralını **kapalı test** izi karşılıyor, davet oraya gitmeli. |
| `play.google.com/store/apps/details?id=...` | Mağaza sayfası; testçi olmayan kişi uygulamayı bulamaz, "item not found" alır. |
| Doğrudan `.apk` bağlantısı | Play üzerinden kurulum sayılmaz, 14 günlük testçi sayacına yazılmaz. |

## 4. Mail şablonu

> **Konu:** PayRadar — kapalı test daveti (Google Play)
>
> Merhaba,
>
> Geliştirdiğim **PayRadar: Ödeme Takibi** adlı Android uygulaması Google Play'de kapalı
> test aşamasında. Yayına çıkabilmesi için 12 testçinin 14 gün boyunca uygulamayı yüklü
> tutması gerekiyor.
>
> Yapman gerekenler:
>
> 1. Telefonunda Google Play'e **bu adresle** (`<TESTÇİ_ADRESİ>`) giriş yaptığından emin ol.
> 2. Aşağıdaki bağlantıyı telefonundan aç ve **"Become a tester / Testçi ol"** düğmesine dokun:
>    https://play.google.com/apps/testing/com.payradar.app
> 3. Aynı sayfada beliren **"Download it on Google Play"** bağlantısından uygulamayı kur.
> 4. Uygulamayı 14 gün boyunca telefonunda yüklü bırak. Arada birkaç kez açman yeterli.
>
> Kurulum istemiyorsan tarayıcı sürümü: https://payradar-bkp.pages.dev
> *(Ama 14 günlük testçi sayacına yalnızca Play üzerinden kurulum yazılır.)*
>
> Uygulama kısaca: kira, fatura, kredi taksiti ve abonelik gibi düzenli ödemeleri tek
> ekranda takip ediyor. Reklam yok, izleme yok; veriler cihazda şifreli duruyor.
>
> Bir sorun olursa bu maile yanıt vermen yeterli.
>
> Teşekkürler,
> Erol Taşcı — Voyagerroc Technologies

## 5. Davet öncesi kontrol listesi

1. Adres **Google hesabına bağlı** mı? Play Console yalnızca Google hesabı olan adresi
   kabul ediyor; değilse satırın yanında kırmızı *"This email address doesn't exist"*
   çıkar ve **kaydın tamamı** başarısız olur (geçersiz tek adres hepsini bloke eder).
   Hotmail/Outlook adresi ancak Google hesabı olarak kayıtlıysa çalışır.
2. Adresi **PayRadar-Testing** listesine ekle ve **Save changes → Save** ile kaydet.
   Aynı liste hem iç test hem kapalı test izinde kullanılıyor.
3. Kaydın gerçekten geçtiğini listedeki **Users** sayısının artmasından doğrula.
4. Maili ancak bundan sonra gönder.
