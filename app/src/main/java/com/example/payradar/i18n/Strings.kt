package com.example.payradar.i18n

import com.example.payradar.model.AppLanguage

object AppStrings {
    private val tr = mapOf(
        "tagline" to "Düzenli ödemelerini takip et, gereksizleri iptal et",

        // Özet kartları
        "summary.monthly" to "Aylık Toplam",
        "summary.yearly" to "Yıllık Tahmini",
        "summary.active" to "Aktif Ödeme",
        "summary.next" to "En Yakın Ödeme",
        "time.renewsToday" to "bugün yenileniyor",
        "time.renewsTomorrow" to "yarın yenileniyor",
        "time.daysLeft" to "{n} gün kaldı",
        "common.none" to "—",

        // Araç çubuğu
        "toolbar.searchPlaceholder" to "Ödeme ara…",
        "filter.all" to "Tümü",
        "sort.date" to "Ödeme tarihine göre",
        "sort.priceDesc" to "Tutara göre (azalan)",
        "sort.name" to "İsme göre (A-Z)",
        "action.addPayment" to "+ Ödeme Ekle",

        // Kategoriler
        "cat.konut" to "Kira & Konut",
        "cat.ulasim" to "Araç & Ulaşım",
        "cat.faturalar" to "Faturalar",
        "cat.abonelik" to "Abonelikler",
        "cat.egitim" to "Eğitim",
        "cat.saglik" to "Sağlık & Spor",
        "cat.sigorta" to "Sigorta",
        "cat.oyun" to "Oyun",
        "cat.diger" to "Diğer",

        // Dönemler
        "cycle.weekly" to "Haftalık",
        "cycle.monthly" to "Aylık",
        "cycle.quarterly" to "3 Aylık",
        "cycle.yearly" to "Yıllık",
        "suffix.weekly" to "/hafta",
        "suffix.monthly" to "/ay",
        "suffix.quarterly" to "/çeyrek",
        "suffix.yearly" to "/yıl",

        // Ödeme kartı
        "card.nextPayment" to "Sonraki ödeme:",
        "card.overdue" to "ödeme tarihi geçti",
        "card.overdueShort" to "gecikti",
        "card.todayShort" to "bugün",
        "card.dayUnit" to "g",
        "card.guide" to "İptal Rehberi",
        "card.trial" to "Deneme",
        "card.trialCharge" to "{n} gün sonra ücretlendirilecek",
        "card.trialChargeToday" to "bugün ücretlendirilecek",
        "card.advance" to "Ödendi / İleri Sar",
        "aria.edit" to "{name} düzenle",
        "aria.delete" to "{name} sil",
        "aria.share" to "{name} paylaş",

        // Boş durum
        "empty.title" to "Hoş geldin! 👋",
        "empty.body" to "Kirandan aboneliğine, araba kirasından faturalarına kadar tüm düzenli ödemelerini tek yerden takip et. Yenileme tarihlerini kaçırma, istemediklerini adım adım iptal et.",
        "empty.addFirst" to "İlk ödemeni ekle",
        "empty.tryDemo" to "Örnek verilerle dene",
        "list.noResults" to "Aramanla eşleşen ödeme yok.",

        // Form
        "form.newTitle" to "Yeni Ödeme",
        "form.editTitle" to "Ödemeyi Düzenle",
        "form.name" to "Ad",
        "form.namePlaceholder" to "örn. Netflix, Ev Kirası, Elektrik Faturası",
        "form.amount" to "Tutar",
        "form.currency" to "Para birimi",
        "form.cycle" to "Dönem",
        "form.nextDate" to "Sonraki ödeme tarihi",
        "form.trialEndDate" to "Deneme bitiş / ilk ücret tarihi",
        "form.isTrial" to "Bu ücretsiz bir deneme sürümü",
        "form.isTrialHint" to "Deneme bitince kartından otomatik ücret alınır. Yukarıdaki tarih, deneme süresinin bittiği/ilk ücretlendirme günüdür.",
        "form.category" to "Kategori",
        "form.notes" to "Not (opsiyonel)",
        "form.notesPlaceholder" to "örn. Aile planı, kardeşimle paylaşımlı",
        "form.error.name" to "Bir ad girmelisin.",
        "form.error.amount" to "Geçerli bir tutar gir.",
        "form.error.date" to "Geçerli bir ödeme tarihi seç.",
        "action.cancel" to "Vazgeç",
        "action.save" to "Kaydet",
        "action.confirm" to "Onayla",

        // İptal rehberi
        "guide.modalTitle" to "{name} — İptal Rehberi",
        "guide.intro" to "Aşağıdaki adımlar genel akışı gösterir; servisler arayüzlerini zaman zaman değiştirebilir.",
        "guide.tipLabel" to "İpucu:",
        "guide.openPage" to "İptal sayfasına git ↗",

        // Ayarlar
        "settings.title" to "Ayarlar",
        "settings.language" to "Dil / Language",
        "settings.reminderQuestion" to "Ödemeden kaç gün önce hatırlatılsın?",
        "settings.daysBefore" to "{n} gün önce",
        "settings.notifications" to "Bildirimleri aç",
        "settings.usdRate" to "1 USD = ? TL",
        "settings.eurRate" to "1 EUR = ? TL",
        "settings.ratesHint" to "Dolar/euro cinsinden ödemeler toplamda TL karşılığıyla hesaplanır.",
        "settings.theme" to "Tema",
        "theme.auto" to "Sistem ile aynı",
        "theme.light" to "Açık",
        "theme.dark" to "Koyu",

        // Ayarlar > Güvenlik
        "security.title" to "Güvenlik 🔒",
        "security.offHint" to "PIN kilidi kapalı. Kilidi açarsan verilerin korunur ve PIN olmadan erişilemez.",
        "security.enableTitle" to "PIN kilidini aç",
        "security.newPin" to "Yeni PIN (4-8 hane)",
        "security.confirmPin" to "PIN (tekrar)",
        "security.activeHint" to "Kilit aktif — verilerin PIN koruması altında.",
        "security.currentPin" to "Mevcut PIN",
        "security.changePinBtn" to "PIN'i Değiştir",
        "security.disableBtn" to "Kilidi Kaldır",
        "security.autoLock" to "Otomatik kilit",
        "autolock.never" to "Asla",
        "autolock.minutes" to "{n} dakika",
        "security.error.mismatch" to "PIN'ler eşleşmiyor veya 4-8 hane değil.",
        "security.error.wrongPin" to "Mevcut PIN hatalı.",

        // Fiyat geçmişi grafiği
        "chart.title" to "{name} — Fiyat Geçmişi",
        "chart.current" to "Şu anki fiyat",
        "chart.change" to "İlk fiyattan değişim",
        "aria.history" to "{name} fiyat geçmişi",

        // Veri yedekleme
        "data.title" to "Veri Yedekleme 💾",
        "data.exportBtn" to "CSV Dışa Aktar",
        "data.importBtn" to "CSV İçe Aktar",
        "data.importHint" to "Dışa aktardığın dosyayı Excel'de açabilirsin. İçe aktarımda aynı ada+tarihe+tutara sahip kayıtlar atlanır, diğerleri eklenir.",
        "toast.importDone" to "{added} ödeme eklendi, {skipped} satır atlandı",

        // Alt bilgi
        "footer.free" to "PayRadar %100 ücretsizdir — reklam yok, takip yok. Verilerin tamamen cihazında saklanır.",
        "footer.openSource" to "Açık kaynak (MIT)",

        // Kilit ekranı
        "lock.enterPin" to "PIN gir",
        "lock.unlock" to "Aç",
        "lock.verifying" to "Doğrulanıyor…",
        "lock.wrongPin" to "Hatalı PIN",
        "lock.forgot" to "PIN'i mi unuttun?",
        "lock.wipeConfirmText" to "Bu işlem TÜM verilerini kalıcı olarak siler ve geri alınamaz. Devam etmek istediğine emin misin?",

        // Bildirim bandı & toastlar
        "banner.notif" to "🔔 Yenileme hatırlatmaları için bildirimleri aç",
        "banner.open" to "Aç",
        "toast.saved" to "Kaydedildi ✓",
        "toast.deleted" to "Ödeme silindi",
        "toast.demoLoaded" to "Örnek veriler yüklendi",
        "toast.settingsSaved" to "Ayarlar kaydedildi",
        "toast.notifEnabled" to "Bildirimler açıldı",
        "toast.notifDenied" to "Bildirim izni verilmedi",
        "toast.lockEnabled" to "Kilit açıldı — veriler artık korumalı",
        "toast.lockDisabled" to "Kilit kaldırıldı",
        "toast.pinChanged" to "PIN değiştirildi",
        "toast.locked" to "Uygulama kilitlendi",
        "confirm.title" to "Emin misin?",
        "confirm.deletePayment" to "\"{name}\" silinsin mi?",
        "confirm.wipe" to "Tüm veriler silinsin mi? Bu işlem geri alınamaz!"
    )

    private val en = mapOf(
        "tagline" to "Track recurring payments, cancel what you don't need",

        "summary.monthly" to "Monthly Total",
        "summary.yearly" to "Yearly Estimate",
        "summary.active" to "Active Payments",
        "summary.next" to "Next Payment",
        "time.renewsToday" to "renews today",
        "time.renewsTomorrow" to "renews tomorrow",
        "time.daysLeft" to "{n} days left",
        "common.none" to "—",

        "toolbar.searchPlaceholder" to "Search payments…",
        "filter.all" to "All",
        "sort.date" to "By payment date",
        "sort.priceDesc" to "By amount (high → low)",
        "sort.name" to "By name (A-Z)",
        "action.addPayment" to "+ Add Payment",

        "cat.konut" to "Rent & Housing",
        "cat.ulasim" to "Car & Transport",
        "cat.faturalar" to "Bills",
        "cat.abonelik" to "Subscriptions",
        "cat.egitim" to "Education",
        "cat.saglik" to "Health & Fitness",
        "cat.sigorta" to "Insurance",
        "cat.oyun" to "Gaming",
        "cat.diger" to "Other",

        "cycle.weekly" to "Weekly",
        "cycle.monthly" to "Monthly",
        "cycle.quarterly" to "Quarterly",
        "cycle.yearly" to "Yearly",
        "suffix.weekly" to "/wk",
        "suffix.monthly" to "/mo",
        "suffix.quarterly" to "/qtr",
        "suffix.yearly" to "/yr",

        "card.nextPayment" to "Next payment:",
        "card.overdue" to "payment overdue",
        "card.overdueShort" to "late",
        "card.todayShort" to "today",
        "card.dayUnit" to "d",
        "card.guide" to "Cancel Guide",
        "card.trial" to "Trial",
        "card.trialCharge" to "will be charged in {n} days",
        "card.trialChargeToday" to "will be charged today",
        "card.advance" to "Paid / Advance",
        "aria.edit" to "Edit {name}",
        "aria.delete" to "Delete {name}",
        "aria.share" to "Share {name}",

        "empty.title" to "Welcome! 👋",
        "empty.body" to "Track every recurring payment — from rent and car leases to bills and subscriptions — in one place. Never miss a renewal, cancel what you don't need step by step.",
        "empty.addFirst" to "Add your first payment",
        "empty.tryDemo" to "Try with sample data",
        "list.noResults" to "No payments match your search.",

        "form.newTitle" to "New Payment",
        "form.editTitle" to "Edit Payment",
        "form.name" to "Name",
        "form.namePlaceholder" to "e.g. Netflix, Apartment Rent, Electric Bill",
        "form.amount" to "Amount",
        "form.currency" to "Currency",
        "form.cycle" to "Cycle",
        "form.nextDate" to "Next payment date",
        "form.trialEndDate" to "Trial end / first charge date",
        "form.isTrial" to "This is a free trial",
        "form.isTrialHint" to "You'll be charged automatically when the trial ends. The date above is the trial end / first charge date.",
        "form.category" to "Category",
        "form.notes" to "Notes (optional)",
        "form.notesPlaceholder" to "e.g. Family plan, shared with my sibling",
        "form.error.name" to "You must enter a name.",
        "form.error.amount" to "Enter a valid amount.",
        "form.error.date" to "Pick a valid payment date.",
        "action.cancel" to "Cancel",
        "action.save" to "Save",
        "action.confirm" to "Confirm",

        "guide.modalTitle" to "{name} — Cancel Guide",
        "guide.intro" to "These steps show the general flow; services may change their interfaces over time.",
        "guide.tipLabel" to "Tip:",
        "guide.openPage" to "Open cancellation page ↗",

        "settings.title" to "Settings",
        "settings.language" to "Language / Dil",
        "settings.reminderQuestion" to "Remind me how many days before payment?",
        "settings.daysBefore" to "{n} days before",
        "settings.notifications" to "Enable notifications",
        "settings.usdRate" to "1 USD = ? TRY",
        "settings.eurRate" to "1 EUR = ? TRY",
        "settings.ratesHint" to "Payments in USD/EUR are converted to TRY in totals using these rates.",
        "settings.theme" to "Theme",
        "theme.auto" to "Follow system",
        "theme.light" to "Light",
        "theme.dark" to "Dark",

        "security.title" to "Security 🔒",
        "security.offHint" to "PIN lock is off. Your data is stored locally. When enabled, access is protected with a PIN.",
        "security.enableTitle" to "Enable PIN lock",
        "security.newPin" to "New PIN (4–8 digits)",
        "security.confirmPin" to "Confirm PIN",
        "security.activeHint" to "Lock is active — your data is protected with PIN security.",
        "security.currentPin" to "Current PIN",
        "security.changePinBtn" to "Change PIN",
        "security.disableBtn" to "Remove lock",
        "security.autoLock" to "Auto-lock",
        "autolock.never" to "Never",
        "autolock.minutes" to "{n} min",
        "security.error.mismatch" to "PINs don't match or aren't 4–8 digits.",
        "security.error.wrongPin" to "Current PIN is incorrect.",

        "chart.title" to "{name} — Price History",
        "chart.current" to "Current price",
        "chart.change" to "Change since first price",
        "aria.history" to "Price history for {name}",

        "data.title" to "Data Backup 💾",
        "data.exportBtn" to "Export CSV",
        "data.importBtn" to "Import CSV",
        "data.importHint" to "The exported file opens in Excel. On import, entries with the same name+date+amount are skipped; others are added.",
        "toast.importDone" to "{added} payments added, {skipped} rows skipped",

        "footer.free" to "PayRadar is 100% free — no ads, no tracking. Your data stays on your device.",
        "footer.openSource" to "Open source (MIT)",

        "lock.enterPin" to "Enter PIN",
        "lock.unlock" to "Unlock",
        "lock.verifying" to "Verifying…",
        "lock.wrongPin" to "Wrong PIN",
        "lock.forgot" to "Forgot your PIN?",
        "lock.wipeConfirmText" to "This will permanently erase ALL your data. This cannot be undone. Are you sure?",

        "banner.notif" to "🔔 Enable notifications for renewal reminders",
        "banner.open" to "Open",
        "toast.saved" to "Saved ✓",
        "toast.deleted" to "Payment deleted",
        "toast.demoLoaded" to "Sample data loaded",
        "toast.settingsSaved" to "Settings saved",
        "toast.notifEnabled" to "Notifications enabled",
        "toast.notifDenied" to "Notification permission denied",
        "toast.lockEnabled" to "Lock enabled — data is now protected",
        "toast.lockDisabled" to "Lock removed",
        "toast.pinChanged" to "PIN changed",
        "toast.locked" to "App locked",
        "confirm.title" to "Are you sure?",
        "confirm.deletePayment" to "Delete \"{name}\"?",
        "confirm.wipe" to "Erase all data? This cannot be undone!"
    )

    fun t(key: String, lang: AppLanguage = AppLanguage.TR, params: Map<String, Any> = emptyMap()): String {
        val dict = if (lang == AppLanguage.EN) en else tr
        var text = dict[key] ?: tr[key] ?: key
        for ((k, v) in params) {
            text = text.replace("{$k}", v.toString())
        }
        return text
    }
}
