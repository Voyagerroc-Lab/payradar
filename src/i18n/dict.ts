import type { Language } from "../types";

const tr = {
  "tagline": "Düzenli ödemelerini takip et, gereksizleri iptal et",

  // Özet kartları
  "summary.monthly": "Aylık Toplam",
  "summary.yearly": "Yıllık Tahmini",
  "summary.active": "Aktif Ödeme",
  "summary.next": "En Yakın Ödeme",
  "time.renewsToday": "bugün yenileniyor",
  "time.renewsTomorrow": "yarın yenileniyor",
  "time.daysLeft": "{n} gün kaldı",
  "common.none": "—",

  // Araç çubuğu
  "toolbar.searchPlaceholder": "Ödeme ara…",
  "filter.all": "Tümü",
  "sort.date": "Ödeme tarihine göre",
  "sort.priceDesc": "Tutara göre (azalan)",
  "sort.name": "İsme göre (A-Z)",
  "action.addPayment": "+ Ödeme Ekle",

  // Kategoriler
  "cat.konut": "Kira & Konut",
  "cat.ulasim": "Araç & Ulaşım",
  "cat.faturalar": "Faturalar",
  "cat.abonelik": "Abonelikler",
  "cat.egitim": "Eğitim",
  "cat.saglik": "Sağlık & Spor",
  "cat.sigorta": "Sigorta",
  "cat.oyun": "Oyun",
  "cat.diger": "Diğer",

  // Dönemler
  "cycle.weekly": "Haftalık",
  "cycle.monthly": "Aylık",
  "cycle.quarterly": "3 Aylık",
  "cycle.yearly": "Yıllık",
  "suffix.weekly": "/hafta",
  "suffix.monthly": "/ay",
  "suffix.quarterly": "/çeyrek",
  "suffix.yearly": "/yıl",

  // Ödeme kartı
  "card.nextPayment": "Sonraki ödeme:",
  "card.overdue": "ödeme tarihi geçti",
  "card.overdueShort": "gecikti",
  "card.todayShort": "bugün",
  "card.dayUnit": "g",
  "card.guide": "İptal Rehberi",
  "card.trial": "Deneme",
  "card.trialCharge": "{n} gün sonra ücretlendirilecek",
  "card.trialChargeToday": "bugün ücretlendirilecek",
  "aria.edit": "{name} düzenle",
  "aria.delete": "{name} sil",

  // Boş durum
  "empty.title": "Hoş geldin! 👋",
  "empty.body":
    "Kirandan aboneliğine, araba kirasından faturalarına kadar tüm düzenli ödemelerini tek yerden takip et. Yenileme tarihlerini kaçırma, istemediklerini adım adım iptal et.",
  "empty.addFirst": "İlk ödemeni ekle",
  "empty.tryDemo": "Örnek verilerle dene",
  "list.noResults": "Aramanla eşleşen ödeme yok.",

  // Form
  "form.newTitle": "Yeni Ödeme",
  "form.editTitle": "Ödemeyi Düzenle",
  "form.name": "Ad",
  "form.namePlaceholder": "örn. Netflix, Ev Kirası, Elektrik Faturası",
  "form.amount": "Tutar",
  "form.currency": "Para birimi",
  "form.cycle": "Dönem",
  "form.nextDate": "Sonraki ödeme tarihi",
  "form.trialEndDate": "Deneme bitiş / ilk ücret tarihi",
  "form.isTrial": "Bu ücretsiz bir deneme sürümü",
  "form.isTrialHint":
    "Deneme bitince kartından otomatik ücret alınır. Yukarıdaki tarih, deneme süresinin bittiği/ilk ücretlendirme günüdür.",
  "form.category": "Kategori",
  "form.notes": "Not (opsiyonel)",
  "form.notesPlaceholder": "örn. Aile planı, kardeşimle paylaşımlı",
  "form.error.name": "Bir ad girmelisin.",
  "form.error.amount": "Geçerli bir tutar gir.",
  "form.error.date": "Geçerli bir ödeme tarihi seç.",
  "action.cancel": "Vazgeç",
  "action.save": "Kaydet",

  // İptal rehberi
  "guide.modalTitle": "{name} — İptal Rehberi",
  "guide.intro":
    "Aşağıdaki adımlar genel akışı gösterir; servisler arayüzlerini zaman zaman değiştirebilir.",
  "guide.tipLabel": "İpucu:",
  "guide.openPage": "İptal sayfasına git ↗",

  // Ayarlar
  "settings.title": "Ayarlar",
  "settings.language": "Dil / Language",
  "settings.reminderQuestion": "Ödemeden kaç gün önce hatırlatılsın?",
  "settings.daysBefore": "{n} gün önce",
  "settings.notifications": "Tarayıcı bildirimlerini aç",
  "settings.usdRate": "1 USD = ? TL",
  "settings.eurRate": "1 EUR = ? TL",
  "settings.ratesHint":
    "Dolar/euro cinsinden ödemeler toplamda TL karşılığıyla hesaplanır.",
  "settings.theme": "Tema",
  "theme.auto": "Sistem ile aynı",
  "theme.light": "Açık",
  "theme.dark": "Koyu",

  // Ayarlar > Güvenlik
  "security.title": "Güvenlik 🔒",
  "security.offHint":
    "PIN kilidi kapalı. Verilerin cihazda şifresiz saklanıyor. Kilidi açarsan veriler AES-GCM ile şifrelenir ve PIN olmadan okunamaz.",
  "security.enableTitle": "PIN kilidini aç",
  "security.newPin": "Yeni PIN (4-8 hane)",
  "security.confirmPin": "PIN (tekrar)",
  "security.activeHint":
    "Kilit aktif — verilerin AES-GCM ile şifreleniyor. Anahtar yalnızca oturum açıkken bellekte tutulur.",
  "security.currentPin": "Mevcut PIN",
  "security.changePinBtn": "PIN'i Değiştir",
  "security.disableBtn": "Kilidi Kaldır",
  "security.autoLock": "Otomatik kilit",
  "autolock.never": "Asla",
  "autolock.minutes": "{n} dakika",
  "security.error.mismatch": "PIN'ler eşleşmiyor veya 4-8 hane değil.",
  "security.error.wrongPin": "Mevcut PIN hatalı.",

  // Fiyat geçmişi grafiği
  "chart.title": "{name} — Fiyat Geçmişi",
  "chart.current": "Şu anki fiyat",
  "chart.change": "İlk fiyattan değişim",
  "aria.history": "{name} fiyat geçmişi",

  // Veri yedekleme
  "data.title": "Veri Yedekleme 💾",
  "data.exportBtn": "CSV Dışa Aktar",
  "data.importBtn": "CSV İçe Aktar",
  "data.importHint":
    "Dışa aktardığın dosyayı Excel'de açabilirsin. İçe aktarımda aynı ada+tarihe+tutara sahip kayıtlar atlanır, diğerleri eklenir.",
  "toast.importDone": "{added} ödeme eklendi, {skipped} satır atlandı",

  // Hesap / bulut
  "account.title": "Hesap ☁️",
  "account.disabledHint":
    "Bulut senkronu bu kurulumda etkin değil. Uygulama yerel modda çalışıyor; verilerin yalnızca bu cihazda.",
  "account.email": "E-posta",
  "account.password": "Şifre (en az 6 karakter)",
  "account.signIn": "Giriş yap",
  "account.signUp": "Hesap oluştur",
  "account.signOut": "Çıkış yap",
  "account.signedInAs": "{email} hesabıyla otomatik senkronize ediliyor.",
  "account.hint":
    "Hesap oluştur; verilerin yalnızca kendi e-postana kaydedilir ve tüm cihazlarında senkronize olur. İnternet olmadan da uygulamayı kullanmaya devam edebilirsin.",
  "account.needsConfirm": "E-postanı doğrula, ardından giriş yap.",
  "account.error.missing": "E-posta ve şifre gerekli.",
  "account.error.generic": "İşlem başarısız: {msg}",
  "toast.cloudSynced": "Bulut senkronizasyonu aktif ☁️",
  "toast.cloudPulled": "Verilerin buluttan geri yüklendi",

  // Alt bilgi
  "footer.free":
    "PayRadar %100 ücretsizdir — reklam yok, takip yok. Verilerin cihazında kalır; istersen bulut senkronu açarsın.",
  "footer.openSource": "Açık kaynak (MIT)",

  // Kilit ekranı
  "lock.enterPin": "PIN gir",
  "lock.unlock": "Aç",
  "lock.verifying": "Doğrulanıyor…",
  "lock.wrongPin": "Hatalı PIN",
  "lock.forgot": "PIN'i mi unuttun?",
  "lock.wipeConfirmText":
    "Bu işlem TÜM verilerini kalıcı olarak siler ve geri alınamaz. Devam etmek istediğine emin misin?",

  // Bildirim bandı & toastlar
  "banner.notif": "🔔 Yenileme hatırlatmaları için bildirimleri aç",
  "banner.open": "Aç",
  "toast.saved": "Kaydedildi ✓",
  "toast.deleted": "Ödeme silindi",
  "toast.demoLoaded": "Örnek veriler yüklendi",
  "toast.settingsSaved": "Ayarlar kaydedildi",
  "toast.notifEnabled": "Bildirimler açıldı",
  "toast.notifDenied": "Bildirim izni verilmedi",
  "toast.lockEnabled": "Kilit açıldı — veriler artık şifreli",
  "toast.lockDisabled": "Kilit kaldırıldı",
  "toast.pinChanged": "PIN değiştirildi",
  "toast.locked": "Uygulama kilitlendi",
  "confirm.deletePayment": '"{name}" silinsin mi?',
  "confirm.wipe": "Tüm veriler silinsin mi? Bu işlem geri alınamaz!",
};

export type TranslationKey = keyof typeof tr;

const en: Record<TranslationKey, string> = {
  "tagline": "Track recurring payments, cancel what you don't need",

  "summary.monthly": "Monthly Total",
  "summary.yearly": "Yearly Estimate",
  "summary.active": "Active Payments",
  "summary.next": "Next Payment",
  "time.renewsToday": "renews today",
  "time.renewsTomorrow": "renews tomorrow",
  "time.daysLeft": "{n} days left",
  "common.none": "—",

  "toolbar.searchPlaceholder": "Search payments…",
  "filter.all": "All",
  "sort.date": "By payment date",
  "sort.priceDesc": "By amount (high → low)",
  "sort.name": "By name (A-Z)",
  "action.addPayment": "+ Add Payment",

  "cat.konut": "Rent & Housing",
  "cat.ulasim": "Car & Transport",
  "cat.faturalar": "Bills",
  "cat.abonelik": "Subscriptions",
  "cat.egitim": "Education",
  "cat.saglik": "Health & Fitness",
  "cat.sigorta": "Insurance",
  "cat.oyun": "Gaming",
  "cat.diger": "Other",

  "cycle.weekly": "Weekly",
  "cycle.monthly": "Monthly",
  "cycle.quarterly": "Quarterly",
  "cycle.yearly": "Yearly",
  "suffix.weekly": "/wk",
  "suffix.monthly": "/mo",
  "suffix.quarterly": "/qtr",
  "suffix.yearly": "/yr",

  "card.nextPayment": "Next payment:",
  "card.overdue": "payment overdue",
  "card.overdueShort": "late",
  "card.todayShort": "today",
  "card.dayUnit": "d",
  "card.guide": "Cancel Guide",
  "card.trial": "Trial",
  "card.trialCharge": "will be charged in {n} days",
  "card.trialChargeToday": "will be charged today",
  "aria.edit": "Edit {name}",
  "aria.delete": "Delete {name}",

  "empty.title": "Welcome! 👋",
  "empty.body":
    "Track every recurring payment — from rent and car leases to bills and subscriptions — in one place. Never miss a renewal, cancel what you don't need step by step.",
  "empty.addFirst": "Add your first payment",
  "empty.tryDemo": "Try with sample data",
  "list.noResults": "No payments match your search.",

  "form.newTitle": "New Payment",
  "form.editTitle": "Edit Payment",
  "form.name": "Name",
  "form.namePlaceholder": "e.g. Netflix, Apartment Rent, Electric Bill",
  "form.amount": "Amount",
  "form.currency": "Currency",
  "form.cycle": "Cycle",
  "form.nextDate": "Next payment date",
  "form.trialEndDate": "Trial end / first charge date",
  "form.isTrial": "This is a free trial",
  "form.isTrialHint":
    "You'll be charged automatically when the trial ends. The date above is the trial end / first charge date.",
  "form.category": "Category",
  "form.notes": "Notes (optional)",
  "form.notesPlaceholder": "e.g. Family plan, shared with my sibling",
  "form.error.name": "You must enter a name.",
  "form.error.amount": "Enter a valid amount.",
  "form.error.date": "Pick a valid payment date.",
  "action.cancel": "Cancel",
  "action.save": "Save",

  "guide.modalTitle": "{name} — Cancel Guide",
  "guide.intro":
    "These steps show the general flow; services may change their interfaces over time.",
  "guide.tipLabel": "Tip:",
  "guide.openPage": "Open cancellation page ↗",

  "settings.title": "Settings",
  "settings.language": "Language / Dil",
  "settings.reminderQuestion": "Remind me how many days before payment?",
  "settings.daysBefore": "{n} days before",
  "settings.notifications": "Enable browser notifications",
  "settings.usdRate": "1 USD = ? TRY",
  "settings.eurRate": "1 EUR = ? TRY",
  "settings.ratesHint":
    "Payments in USD/EUR are converted to TRY in totals using these rates.",
  "settings.theme": "Theme",
  "theme.auto": "Follow system",
  "theme.light": "Light",
  "theme.dark": "Dark",

  "security.title": "Security 🔒",
  "security.offHint":
    "PIN lock is off. Your data is stored unencrypted on this device. When enabled, data is encrypted with AES-GCM and unreadable without your PIN.",
  "security.enableTitle": "Enable PIN lock",
  "security.newPin": "New PIN (4–8 digits)",
  "security.confirmPin": "Confirm PIN",
  "security.activeHint":
    "Lock is active — your data is encrypted with AES-GCM. The key lives only in memory while unlocked.",
  "security.currentPin": "Current PIN",
  "security.changePinBtn": "Change PIN",
  "security.disableBtn": "Remove lock",
  "security.autoLock": "Auto-lock",
  "autolock.never": "Never",
  "autolock.minutes": "{n} min",
  "security.error.mismatch": "PINs don't match or aren't 4–8 digits.",
  "security.error.wrongPin": "Current PIN is incorrect.",

  "chart.title": "{name} — Price History",
  "chart.current": "Current price",
  "chart.change": "Change since first price",
  "aria.history": "Price history for {name}",

  "data.title": "Data Backup 💾",
  "data.exportBtn": "Export CSV",
  "data.importBtn": "Import CSV",
  "data.importHint":
    "The exported file opens in Excel. On import, entries with the same name+date+amount are skipped; others are added.",
  "toast.importDone": "{added} payments added, {skipped} rows skipped",

  "account.title": "Account ☁️",
  "account.disabledHint":
    "Cloud sync is not configured in this build. Running in local mode; your data stays on this device only.",
  "account.email": "Email",
  "account.password": "Password (min 6 characters)",
  "account.signIn": "Sign in",
  "account.signUp": "Create account",
  "account.signOut": "Sign out",
  "account.signedInAs": "Syncing automatically as {email}.",
  "account.hint":
    "Create an account to back up your payments under your own email and sync across all your devices. The app keeps working offline.",
  "account.needsConfirm": "Confirm your email, then sign in.",
  "account.error.missing": "Email and password are required.",
  "account.error.generic": "Action failed: {msg}",
  "toast.cloudSynced": "Cloud sync enabled ☁️",
  "toast.cloudPulled": "Your data was restored from the cloud",

  "footer.free":
    "PayRadar is 100% free — no ads, no tracking. Your data stays on your device unless you enable cloud sync.",
  "footer.openSource": "Open source (MIT)",

  "lock.enterPin": "Enter PIN",
  "lock.unlock": "Unlock",
  "lock.verifying": "Verifying…",
  "lock.wrongPin": "Wrong PIN",
  "lock.forgot": "Forgot your PIN?",
  "lock.wipeConfirmText":
    "This will permanently erase ALL your data. This cannot be undone. Are you sure?",

  "banner.notif": "🔔 Enable notifications for renewal reminders",
  "banner.open": "Open",
  "toast.saved": "Saved ✓",
  "toast.deleted": "Payment deleted",
  "toast.demoLoaded": "Sample data loaded",
  "toast.settingsSaved": "Settings saved",
  "toast.notifEnabled": "Notifications enabled",
  "toast.notifDenied": "Notification permission denied",
  "toast.lockEnabled": "Lock enabled — data is now encrypted",
  "toast.lockDisabled": "Lock removed",
  "toast.pinChanged": "PIN changed",
  "toast.locked": "App locked",
  "confirm.deletePayment": 'Delete "{name}"?',
  "confirm.wipe": "Erase all data? This cannot be undone!",
};

export const translations: Record<Language, Record<TranslationKey, string>> = {
  tr,
  en,
};
