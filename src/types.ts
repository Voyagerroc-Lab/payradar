export type CategoryId =
  | "konut"
  | "ulasim"
  | "faturalar"
  | "abonelik"
  | "egitim"
  | "saglik"
  | "sigorta"
  | "kredi"
  | "cek_senet"
  | "oyun"
  | "diger";

/** ISO 4217 para birimi kodu (geçerli liste: lib/fx.ts CURRENCIES). */
export type Currency = string;

export type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly";

export type Language = "tr" | "en" | "ms" | "es" | "ar";

/** Görünüm teması: dört temel tema + dört kulüp teması.
    "paper": sıcak kâğıt zemin + derin turkuaz vurgu (basılı enstrüman havası). */
export type ThemeId = "auto" | "light" | "dark" | "paper" | "gs" | "fb" | "bjk" | "ts";

/** Ayarlar ekranındaki kulüp temaları (sıra ekranda göründüğü sıradır). */
export const TEAM_THEMES = ["gs", "fb", "bjk", "ts"] as const;

export const THEME_IDS: readonly ThemeId[] = [
  "auto",
  "light",
  "dark",
  "paper",
  ...TEAM_THEMES,
];

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && (THEME_IDS as readonly string[]).includes(value);
}

/** Fiyat geçmişindeki tek nokta */
export interface PricePoint {
  /** ISO tarih: fiyat bu tarihte geçerliydi */
  date: string;
  price: number;
}

/** Düzenli ödeme: kira, fatura, abonelik, araç kirası… hepsi bu modelde */
export interface Payment {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  billingCycle: BillingCycle;
  /** ISO tarih: yyyy-mm-dd (sonraki ödeme) */
  nextPaymentDate: string;
  categoryId: CategoryId;
  notes?: string;
  createdAt: number;
  /** Eskiden bugüne fiyat değişimleri (eskiden yeniye sıralı) */
  priceHistory?: PricePoint[];
  /** true ise nextPaymentDate, deneme süresinin bittiği/ilk ücretlendirme günüdür */
  isTrial?: boolean;
  /** Yalnızca kredi kategorisi: kredinin çekildiği banka */
  bankName?: string;
  /** Yalnızca kredi kategorisi: toplam taksit sayısı */
  totalInstallments?: number;
  /** Yalnızca kredi kategorisi: kaçıncı taksitte olunduğu */
  currentInstallment?: number;
  /** Yalnızca cek_senet kategorisi: çek/senet seri numarası */
  checkNumber?: string;
  /** Yalnızca cek_senet kategorisi: keşideci/alacaklı firma */
  payee?: string;
}

/** Kilit açılmadan önce okunması güvenli tercihler (şifresiz saklanır) */
export interface Prefs {
  language: Language;
  theme: ThemeId;
  /** Gösterim para birimi: tüm tutarlar bu birimde gösterilir (dilden bağımsız) */
  displayCurrency: Currency;
  lockEnabled: boolean;
  autoLockMinutes: number; // 0 = kapalı
}

/** Kilitliyken yalnızca PIN ile erişilebilen veriler */
export interface VaultData {
  payments: Payment[];
  reminderDays: number;
  notificationsEnabled: boolean;
  usdTry: number;
  eurTry: number;
  /** Son değişiklik zamanı (bulut çakışma çözümü için) */
  updatedAt: number;
  /** Cihazlar arası taşınan görünüm tercihleri (bulut senkronuyla gelir) */
  appTheme?: ThemeId;
  appLanguage?: Language;
}

export interface CancelGuide {
  id: string;
  displayName: string;
  /** İngilizce arayüz için karşılık; yoksa Türkçesi gösterilir (yalnızca yerel servisler). */
  displayNameEn?: string;
  aliases: string[];
  steps: string[];
  stepsEn?: string[];
  cancelUrl?: string;
  tip?: string;
  tipEn?: string;
}
