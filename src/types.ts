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
}

export interface CancelGuide {
  id: string;
  displayName: string;
  aliases: string[];
  steps: string[];
  cancelUrl?: string;
  tip?: string;
}
