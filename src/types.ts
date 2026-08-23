export type CategoryId =
  | "konut"
  | "ulasim"
  | "faturalar"
  | "abonelik"
  | "egitim"
  | "saglik"
  | "sigorta"
  | "oyun"
  | "diger";

export type Currency = "TRY" | "USD" | "EUR";

export type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly";

export type Language = "tr" | "en";

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
}

/** Kilit açılmadan önce okunması güvenli tercihler (şifresiz saklanır) */
export interface Prefs {
  language: Language;
  theme: "auto" | "light" | "dark";
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
}

export interface CancelGuide {
  id: string;
  displayName: string;
  aliases: string[];
  steps: string[];
  cancelUrl?: string;
  tip?: string;
}
