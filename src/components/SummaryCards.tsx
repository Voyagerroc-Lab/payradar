import type { Payment, VaultData } from "../types";
import { daysUntil, formatMoney, toTryPerMonth } from "../lib/format";
import { useI18n } from "../i18n";
import { useTilt } from "../lib/tilt";
import type { TranslationKey } from "../i18n/dict";

interface SummaryCardsProps {
  payments: Payment[];
  vault: VaultData;
}

export default function SummaryCards({ payments, vault }: SummaryCardsProps) {
  const { t, lang } = useI18n();
  const sceneRef = useTilt<HTMLElement>(".summary-card");
  const monthly = payments.reduce(
    (sum, p) => sum + toTryPerMonth(p, vault.usdTry, vault.eurTry),
    0,
  );
  const yearly = monthly * 12;

  const upcoming = [...payments]
    .map((p) => ({ p, days: daysUntil(p.nextPaymentDate) }))
    .filter((x) => x.days >= 0)
    .sort((a, b) => a.days - b.days)[0];

  return (
    <section className="summary" ref={sceneRef}>
      <div className="card summary-card summary-indigo">
        <span className="summary-icon" aria-hidden="true">
          💸
        </span>
        <span className="summary-label">{t("summary.monthly")}</span>
        <span className="summary-value">{formatMoney(monthly, "TRY", lang)}</span>
      </div>
      <div className="card summary-card summary-violet">
        <span className="summary-icon" aria-hidden="true">
          📈
        </span>
        <span className="summary-label">{t("summary.yearly")}</span>
        <span className="summary-value">{formatMoney(yearly, "TRY", lang)}</span>
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

function describeDays(days: number, t: TFn): string {
  if (days === 0) return t("time.renewsToday");
  if (days === 1) return t("time.renewsTomorrow");
  return t("time.daysLeft", { n: days });
}
