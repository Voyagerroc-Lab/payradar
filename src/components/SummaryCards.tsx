import type { Payment, VaultData } from "../types";
import { localeFor, toTryPerMonth } from "../lib/format";
import { useI18n } from "../i18n";
import type { TranslationKey } from "../i18n/dict";

interface SummaryCardsProps {
  payments: Payment[];
  vault: VaultData;
}

export default function SummaryCards({ payments, vault }: SummaryCardsProps) {
  const { t, lang } = useI18n();
  const monthly = payments.reduce(
    (sum, p) => sum + toTryPerMonth(p, vault.usdTry, vault.eurTry),
    0,
  );
  const yearly = monthly * 12;

  const upcoming = [...payments]
    .map((p) => ({ p, days: daysLeft(p.nextPaymentDate) }))
    .filter((x) => x.days >= 0)
    .sort((a, b) => a.days - b.days)[0];

  return (
    <section className="summary">
      <div className="card summary-card summary-indigo">
        <span className="summary-icon" aria-hidden="true">
          💸
        </span>
        <span className="summary-label">{t("summary.monthly")}</span>
        <span className="summary-value">{formatTRY(monthly, lang)}</span>
      </div>
      <div className="card summary-card summary-violet">
        <span className="summary-icon" aria-hidden="true">
          📈
        </span>
        <span className="summary-label">{t("summary.yearly")}</span>
        <span className="summary-value">{formatTRY(yearly, lang)}</span>
      </div>
      <div className="card summary-card summary-teal">
        <span className="summary-icon" aria-hidden="true">
          🧾
        </span>
        <span className="summary-label">{t("summary.active")}</span>
        <span className="summary-value">{payments.length}</span>
      </div>
      <div className="card summary-card summary-amber">
        <span className="summary-icon" aria-hidden="true">
          ⏰
        </span>
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

function formatTRY(amount: number, lang: "tr" | "en" | "ms"): string {
  return new Intl.NumberFormat(localeFor(lang), {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
