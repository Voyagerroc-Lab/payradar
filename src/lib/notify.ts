import type { Payment } from "../types";
import { daysUntil } from "./format";

const NOTIFIED_KEY = "payradar:notified";

function loadNotified(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveNotified(map: Record<string, string>): void {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/**
 * Yaklaşan ödemeleri kontrol edip bildirim gönderir.
 * Aynı gün aynı ödeme için tekrar bildirim atmaz.
 */
export function checkUpcomingPayments(
  payments: Payment[],
  reminderDays: number,
): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const notified = loadNotified();
  const today = new Date().toISOString().slice(0, 10);
  let changed = false;

  for (const payment of payments) {
    const days = daysUntil(payment.nextPaymentDate);
    if (days >= 0 && days <= reminderDays && notified[payment.id] !== today) {
      new Notification("PayRadar", {
        body:
          days === 0
            ? `${payment.name}: ${new Date().toLocaleDateString()} — bugün yenileniyor!`
            : `${payment.name}: ${days} gün içinde yenilenecek.`,
        tag: payment.id,
      });
      notified[payment.id] = today;
      changed = true;
    }
  }

  if (changed) saveNotified(notified);
}
