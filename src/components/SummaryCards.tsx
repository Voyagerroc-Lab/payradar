import type { Payment, VaultData } from "../types";
import { monthlyAmount } from "../lib/format";
import { useI18n } from "../i18n";
import type { TranslationKey } from "../i18n/dict";

interface SummaryCardsProps {
  payments: Payment[];
  vault: VaultData;
}

function toTryPerMonth(payment: Payment, vault: VaultData): number {
  let amount = monthlyAmount(payment.price, payment.billingCycle);
  if (payment.currency === "USD") amount *= vault.usdTry || 1;
  if (payment.currency === "EUR") amount *= vault.eurTry || 1;
  return amount;
}

export default function SummaryCards({ payments, vault }: SummaryCardsProps) {
  const { t } = useI18n();
  const monthly = payments.reduce((sum, p) => sum + toTryPerMonth(p, vault), 0);
  const yearly = monthly * 12;

  const upcoming = [...payments]
    .map((p) => ({ p, days: daysLeft(p.nextPaymentDate) }))
    .filter((x) => x.days >= 0)
    .sort((a, b) => a.days - b.days)[0];

  return (
    <section className="summary">
      <div className="card summary-card">
        <span className="summary-label">{t("summary.monthly")}</span>
        <span className="summary-value">{formatTRY(monthly)}</span>
      </div>
      <div className="card summary-card">
        <span className="summary-label">{t("summary.yearly")}</span>
        <span className="summary-value">{formatTRY(yearly)}</span>
      </div>
      <div className="card summary-card">
        <span className="summary-label">{t("summary.active")}</span>
        <span className="summary-value">{payments.length}</span>
      </div>
      <div className="card summary-card">
        <span className="summary-label">{t("summary.next")}</span>
        {upcoming ? (
          <span className="summary-value summary-next">
            {upcoming.p.name}
            <small>{describeDays(upcoming.days, t)}</small>
          </span>
        ) : (
          <span className="summary-value muted">—</span>
        )}
      </div>
    </section>
  );
}

type TFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

function daysLeft(iso: string): number {
  const target = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function describeDays(days: number, t: TFn): string {
  if (days === 0) return t("time.renewsToday");
  if (days === 1) return t("time.renewsTomorrow");
  return t("time.daysLeft", { n: days });
}

function formatTRY(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
