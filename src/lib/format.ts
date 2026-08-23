import type { BillingCycle, CategoryId, Currency } from "../types";
import type { TranslationKey } from "../i18n/dict";

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

export function formatDateTR(iso: string, lang: "tr" | "en" = "tr"): string {
  return new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseISO(iso));
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
