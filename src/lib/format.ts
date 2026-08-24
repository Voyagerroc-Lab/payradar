import type { BillingCycle, CategoryId, Currency, Payment } from "../types";
import type { TranslationKey } from "../i18n/dict";

/** Dil kodunu Intl locale'ine çevirir; tüm tarih/saat biçimlendirme bunu kullanmalı. */
export function localeFor(lang: "tr" | "en" | "ms"): string {
  if (lang === "tr") return "tr-TR";
  if (lang === "ms") return "ms-MY";
  return "en-GB";
}

/** Taksit girişini ayrıştırır: boş/geçersiz/0 → undefined. Form ve CSV ortak kullanır. */
export function parseInstallment(raw: string | undefined): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Aylık TL eşdeğeri: USD/EUR kurla çevrilir. Özet kartları ve sıralama ortak kullanır. */
export function toTryPerMonth(payment: Payment, usdTry: number, eurTry: number): number {
  let amount = monthlyAmount(payment.price, payment.billingCycle);
  if (payment.currency === "USD") amount *= usdTry || 1;
  if (payment.currency === "EUR") amount *= eurTry || 1;
  return amount;
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

export const CATEGORIES: Record<
  CategoryId,
  { emoji: string; color: string; labelKey: TranslationKey }
> = {
  konut: { emoji: "🏠", color: "#e5484d", labelKey: "cat.konut" },
  ulasim: { emoji: "🚗", color: "#0091ff", labelKey: "cat.ulasim" },
  faturalar: { emoji: "🧾", color: "#f76b15", labelKey: "cat.faturalar" },
  abonelik: { emoji: "📺", color: "#8e4ec6", labelKey: "cat.abonelik" },
  egitim: { emoji: "📚", color: "#ffb224", labelKey: "cat.egitim" },
  saglik: { emoji: "💪", color: "#30a46c", labelKey: "cat.saglik" },
  sigorta: { emoji: "🛡️", color: "#05a2c2", labelKey: "cat.sigorta" },
  kredi: { emoji: "🏦", color: "#2563eb", labelKey: "cat.kredi" },
  cek_senet: { emoji: "📜", color: "#7c3aed", labelKey: "cat.cek_senet" },
  oyun: { emoji: "🎮", color: "#7d6ee0", labelKey: "cat.oyun" },
  diger: { emoji: "📦", color: "#8d8d8d", labelKey: "cat.diger" },
};

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
};

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat("tr-TR", {
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

export function formatDateTR(iso: string, lang: "tr" | "en" | "ms" = "tr"): string {
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

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0);
  return d;
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
