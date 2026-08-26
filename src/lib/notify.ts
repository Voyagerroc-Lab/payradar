import type { Currency, Language, Payment } from "../types";
import { daysUntil, formatMoney } from "./format";
import { convert, homeCurrency, type FxTable } from "./fx";
import { makeT } from "../i18n/t";

const NOTIFIED_KEY = "payradar:notified";

function loadNotified(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveNotified(map: Record<string, string>): void {
  try {
    // Yalnızca bugünün kayıtlarını tut; silinen/eski ödemelerin girdileri sonsuza dek birikmesin
    const today = new Date().toISOString().slice(0, 10);
    const pruned = Object.fromEntries(
      Object.entries(map).filter(([, date]) => date === today),
    );
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(pruned));
  } catch {
    /* depolama dolu/erişilemez olabilir; bildirim bir dahaki değişiklikte tekrar denenir */
  }
}

/** Test butonu için: bugünkü "gönderildi" kayıtlarını sıfırlar ki bildirim tekrar tetiklensin. */
export function clearNotifiedToday(): void {
  saveNotified({});
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export interface NotifyOptions {
  lang?: Language;
  usdTry?: number;
  eurTry?: number;
  /** Canlı kur tablosu; özet toplamı dilin ana para biriminde hesaplanır */
  fx?: FxTable | null;
}

/** Kategoriye göre bildirim başlığı ön eki + ayrıntı (banka/taksit, çek no). */
function titleFor(payment: Payment, t: ReturnType<typeof makeT>): string {
  const prefix =
    payment.categoryId === "kredi"
      ? t("notif.prefix.kredi")
      : payment.categoryId === "cek_senet"
        ? t("notif.prefix.cek_senet")
        : payment.categoryId === "faturalar"
          ? t("notif.prefix.faturalar")
          : t("notif.prefix.default");

  let sub = "";
  if (payment.categoryId === "kredi" && payment.bankName) {
    const inst = t("form.installmentBadge", {
      current: payment.currentInstallment ?? 1,
      total: payment.totalInstallments ?? 1,
    });
    sub = ` (${payment.bankName} - ${inst})`;
  } else if (payment.categoryId === "cek_senet" && payment.checkNumber) {
    sub = ` (No: ${payment.checkNumber})`;
  }
  return `${prefix}${payment.name}${sub}`;
}

function timeText(days: number, t: ReturnType<typeof makeT>): string {
  if (days < 0) return t("notif.overdue", { n: -days });
  if (days === 0) return t("notif.today");
  if (days === 1) return t("notif.tomorrow");
  return t("notif.daysLeft", { n: days });
}

function lineDayText(days: number, t: ReturnType<typeof makeT>): string {
  if (days < 0) return t("notif.line.overdue", { n: -days });
  if (days === 0) return t("notif.line.today");
  if (days === 1) return t("notif.line.tomorrow");
  return t("notif.line.daysLeft", { n: days });
}

/** Vadesi gelen GERÇEK tutarın ana para birimindeki karşılığı — özet satırlarıyla
 *  tutarlı olsun diye aylık eşdeğere çevrilmez, ödemenin kendi fiyatı kullanılır. */
function dueIn(
  payment: Payment,
  home: Currency,
  fx: FxTable | null,
  usdTry: number,
  eurTry: number,
): number {
  return convert(payment.price, payment.currency, home, fx, { usdTry, eurTry });
}

/**
 * Yaklaşan ve 2 güne kadar gecikmiş ödemeleri kontrol edip bildirim gönderir.
 * Birden fazla acil ödeme varsa tek bir özet bildirimi atar.
 * Aynı gün aynı ödeme için tekrar bildirim atmaz.
 */
export function checkUpcomingPayments(
  payments: Payment[],
  reminderDays: number,
  options: NotifyOptions = {},
): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const lang = options.lang ?? "tr";
  const t = makeT(lang);
  const notified = loadNotified();
  const today = new Date().toISOString().slice(0, 10);

  const urgent = payments
    .map((p) => ({ payment: p, days: daysUntil(p.nextPaymentDate) }))
    .filter(
      ({ payment, days }) =>
        days >= -2 && days <= reminderDays && notified[payment.id] !== today,
    )
    .sort((a, b) => a.days - b.days);

  if (urgent.length === 0) return;

  if (urgent.length === 1) {
    const { payment, days } = urgent[0];
    // Deneme metni yalnızca gelecek/bugün için anlamlı; gecikmişse standart gecikme metni
    const body =
      payment.isTrial && days >= 0
        ? days === 0
          ? `${payment.name}: ${t("notif.trialToday")}`
          : `${payment.name}: ${t("notif.trialDays", { n: days })}`
        : `${timeText(days, t)} • ${t("notif.amount", {
            amount: formatMoney(payment.price, payment.currency, lang),
          })}`;
    const n = new Notification(titleFor(payment, t), { body, tag: payment.id });
    n.onclick = () => window.focus();
    notified[payment.id] = today;
  } else {
    const usdTry = options.usdTry ?? 42;
    const eurTry = options.eurTry ?? 48;
    const home = homeCurrency(lang);
    const fx = options.fx ?? null;
    // Özet en fazla 5 satır gösterir; yalnızca GÖSTERİLENLER bildirildi sayılır,
    // kalanlar bir sonraki kontrolde kendi özetlerini alır.
    const shown = urgent.slice(0, 5);
    const total = shown.reduce(
      (sum, { payment }) => sum + dueIn(payment, home, fx, usdTry, eurTry),
      0,
    );
    const lines = shown.map(
      ({ payment, days }) =>
        `${lineDayText(days, t)}: ${payment.isTrial && days >= 0 ? "🎁 " : ""}${payment.name} - ${formatMoney(payment.price, payment.currency, lang)}`,
    );
    const body = [
      ...lines,
      t("notif.digestTotal", { amount: formatMoney(total, home, lang) }),
    ].join("\n");
    const n = new Notification(t("notif.digestTitle", { n: shown.length }), {
      body,
      tag: "payradar-digest",
    });
    n.onclick = () => window.focus();
    for (const { payment } of shown) notified[payment.id] = today;
  }

  saveNotified(notified);
}
