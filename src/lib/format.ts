import type { BillingCycle, CategoryId, Currency, Language, Payment } from "../types";
import type { TranslationKey } from "../i18n/dict";
import type { IconName } from "../components/icons";
import { convert, type FxTable, type LegacyRates } from "./fx";

/** Dil kodunu Intl locale'ine çevirir; tüm tarih/saat biçimlendirme bunu kullanmalı.
 *  ar-AE'de Latin rakamları zorlanır (nu-latn): tutarlar tabular hizada kalır. */
export function localeFor(lang: Language): string {
  if (lang === "tr") return "tr-TR";
  if (lang === "ms") return "ms-MY";
  if (lang === "es") return "es-MX";
  if (lang === "ar") return "ar-AE-u-nu-latn";
  return "en-GB";
}

/** Taksit girişini ayrıştırır: boş/geçersiz/0 → undefined. Form ve CSV ortak kullanır. */
export function parseInstallment(raw: string | undefined): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Tek seferlik (vadeli) kalemler: çek/senet döngüye girmez, vadesi gelince kapanır. */
export function isOneShot(payment: Payment): boolean {
  return payment.categoryId === "cek_senet";
}

/** Son taksiti ödenmek üzere olan kredi mi? (12/12'deki "Ödendi" krediyi kapatır) */
export function isFinalInstallment(payment: Payment): boolean {
  return (
    payment.categoryId === "kredi" &&
    payment.currentInstallment != null &&
    payment.totalInstallments != null &&
    payment.currentInstallment >= payment.totalInstallments
  );
}

/** "Ödendi" bu kalemi kapatır mı, yoksa bir sonraki döneme mi taşır? */
export function completesOnAdvance(payment: Payment): boolean {
  return isOneShot(payment) || isFinalInstallment(payment);
}

/** Arşivlenmemiş, hâlâ para çıkışı yaratan kalemler — tüm toplamların girdisi. */
export function activePayments(payments: Payment[]): Payment[] {
  return payments.filter((p) => !p.isCompleted);
}

/**
 * Kartın sıralamada ve özetlerde kullandığı vade.
 * Periyodik kalemlerde geçmiş tarih bir sonraki döneme sarılır; tek seferlik
 * çek/senette sarmaz — vadesi geçmiş bir çek "geçen ay"da kalır, aya devretmez.
 */
export function dueDateOf(payment: Payment): string {
  return isOneShot(payment)
    ? payment.nextPaymentDate
    : nextOccurrence(payment.nextPaymentDate, payment.billingCycle);
}

/** Aylık eşdeğerin ana para birimindeki karşılığı. Özet kartları ve sıralama ortak kullanır. */
export function toMonthlyIn(
  payment: Payment,
  home: Currency,
  fx: FxTable | null,
  legacy?: LegacyRates,
): number {
  return convert(
    monthlyAmount(payment.price, payment.billingCycle),
    payment.currency,
    home,
    fx,
    legacy,
  );
}

/**
 * Kategoriye özel alanları temizler: bankName/taksitler yalnızca kredi'de,
 * checkNumber/payee yalnızca cek_senet'te kalır. Tüm üreticiler (form, CSV,
 * bulut) bu tek kapıdan geçmeli ki alan sızıntısı olmasın.
 */
export function sanitizeCategoryFields(p: Payment): Payment {
  const isKredi = p.categoryId === "kredi";
  const isCekSenet = p.categoryId === "cek_senet";
  return {
    ...p,
    bankName: isKredi ? p.bankName : undefined,
    currentInstallment: isKredi ? p.currentInstallment : undefined,
    totalInstallments: isKredi ? p.totalInstallments : undefined,
    checkNumber: isCekSenet ? p.checkNumber : undefined,
    payee: isCekSenet ? p.payee : undefined,
  };
}

/**
 * Kategori paleti. `ink`, o renk zeminde okunabilir yazı rengidir: açık/parlak
 * zeminlerde (sarı, turkuaz…) beyaz harf 1.4:1 kontrastla okunmuyordu; koyu
 * mürekkep WCAG AA eşiğini geçirir. Renk seçilirken zeminin bağıl parlaklığı
 * ölçüldü — göz kararı değil.
 */
export const CATEGORY_INK_DARK = "#1a1c1e";

export const CATEGORIES: Record<
  CategoryId,
  { icon: IconName; color: string; ink: string; labelKey: TranslationKey }
> = {
  konut: { icon: "home", color: "#e5484d", ink: "#fff", labelKey: "cat.konut" },
  ulasim: { icon: "car", color: "#0091ff", ink: "#fff", labelKey: "cat.ulasim" },
  faturalar: { icon: "receipt", color: "#f76b15", ink: CATEGORY_INK_DARK, labelKey: "cat.faturalar" },
  abonelik: { icon: "screen", color: "#8e4ec6", ink: "#fff", labelKey: "cat.abonelik" },
  egitim: { icon: "book", color: "#ffb224", ink: CATEGORY_INK_DARK, labelKey: "cat.egitim" },
  saglik: { icon: "pulse", color: "#30a46c", ink: "#fff", labelKey: "cat.saglik" },
  sigorta: { icon: "shield", color: "#05a2c2", ink: CATEGORY_INK_DARK, labelKey: "cat.sigorta" },
  kredi: { icon: "bank", color: "#2563eb", ink: "#fff", labelKey: "cat.kredi" },
  cek_senet: { icon: "scroll", color: "#7c3aed", ink: "#fff", labelKey: "cat.cek_senet" },
  oyun: { icon: "gamepad", color: "#7d6ee0", ink: "#fff", labelKey: "cat.oyun" },
  diger: { icon: "box", color: "#8d8d8d", ink: "#fff", labelKey: "cat.diger" },
};

export function formatMoney(
  amount: number,
  currency: Currency,
  lang: Language = "tr",
): string {
  return new Intl.NumberFormat(localeFor(lang), {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Aylık eşdeğer tutar */
export function monthlyAmount(price: number, cycle: BillingCycle): number {
  switch (cycle) {
    case "weekly":
      return (price * 52) / 12;
    case "quarterly":
      return price / 3;
    case "yearly":
      return price / 12;
    default:
      return price;
  }
}

/**
 * "149,99", "18.500,50" (TR) ve "18,500.50" (US) gibi biçimleri doğru ayrıştırır.
 * Virgül ve nokta birlikte geçiyorsa sondaki ondalık ayracıdır, diğeri binlik ayracı sayılıp atılır.
 */
export function parseAmount(raw: string): number {
  const s = raw.trim();
  if (!s) return NaN;
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    return s.lastIndexOf(",") > s.lastIndexOf(".")
      ? Number(s.replace(/\./g, "").replace(",", "."))
      : Number(s.replace(/,/g, ""));
  }
  if (hasComma) return Number(s.replace(",", "."));
  return Number(s);
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysUntil(iso: string): number {
  const target = parseISO(iso);
  const today = parseISO(todayISO());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function formatDateTR(iso: string, lang: Language = "tr"): string {
  return new Intl.DateTimeFormat(localeFor(lang), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseISO(iso));
}

/**
 * "Ödendi" işlemi: tarihten bağımsız olarak EN AZ bir tam dönem ileri sarar;
 * çok gecikmişse bugünün ilerisine gelene kadar dönem atlamaya devam eder.
 */
export function advanceCycle(iso: string, cycle: BillingCycle): string {
  const date = parseISO(iso);
  const next =
    cycle === "weekly"
      ? addDays(date, 7)
      : addMonths(date, cycle === "monthly" ? 1 : cycle === "quarterly" ? 3 : 12);
  return nextOccurrence(toISO(next), cycle);
}

/** Ödeme tarihini bugüne göre ileri sar; geçmişse bir sonraki döneme atla. */
export function nextOccurrence(iso: string, cycle: BillingCycle): string {
  let date = parseISO(iso);
  const today = parseISO(todayISO());
  while (date < today) {
    date =
      cycle === "weekly"
        ? addDays(date, 7)
        : addMonths(date, cycle === "monthly" ? 1 : cycle === "quarterly" ? 3 : 12);
  }
  return toISO(date);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0);
  return d;
}

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
