import type { Currency, Payment, VaultData } from "../types";
import { daysUntil, formatMoney, toMonthlyIn } from "../lib/format";
import { type FxTable } from "../lib/fx";
import { useI18n } from "../i18n";
import { useTilt } from "../lib/tilt";
import type { TranslationKey } from "../i18n/dict";
import { Icon } from "./icons";

interface SummaryCardsProps {
  payments: Payment[];
  vault: VaultData;
  fx: FxTable | null;
  /** Ayarlar'daki gösterim birimi: toplamlar bu birimde hesaplanır */
  displayCurrency: Currency;
}

export default function SummaryCards({
  payments,
  vault,
  fx,
  displayCurrency,
}: SummaryCardsProps) {
  const { t, lang } = useI18n();
  const sceneRef = useTilt<HTMLElement>(".summary-card");
  const home = displayCurrency;
  const legacy = { usdTry: vault.usdTry, eurTry: vault.eurTry };
  const monthly = payments.reduce(
    (sum, p) => sum + toMonthlyIn(p, home, fx, legacy),
    0,
  );
  const yearly = monthly * 12;

  const upcoming = [...payments]
    .map((p) => ({ p, days: daysUntil(p.nextPaymentDate) }))
    .filter((x) => x.days >= 0)
    .sort((a, b) => a.days - b.days)[0];

  return (
    <section className="summary" ref={sceneRef}>
      {/* Aylık toplam sahnenin kahramanıdır: tam satır, büyük punto.
          Diğer üçü destek rolünde sessizleşir — renk çubuğu şablonu yok. */}
      <div className="card summary-card summary-hero summary-indigo">
        <span className="summary-icon" aria-hidden="true">
          <Icon name="coins" size={19} />
        </span>
        <span className="summary-label">{t("summary.monthly")}</span>
        <span className="summary-value">{formatMoney(monthly, home, lang)}</span>
      </div>
      <div className="card summary-card summary-violet">
        <span className="summary-icon" aria-hidden="true">
          <Icon name="trend" size={17} />
        </span>
        <span className="summary-label">{t("summary.yearly")}</span>
        <span className="summary-value">{formatMoney(yearly, home, lang)}</span>
      </div>
      <div className="card summary-card summary-teal">
        <span className="summary-icon" aria-hidden="true">
          <Icon name="layers" size={17} />
        </span>
        <span className="summary-label">{t("summary.active")}</span>
        <span className="summary-value">{payments.length}</span>
      </div>
      <div className="card summary-card summary-amber summary-card-next">
        <span className="summary-icon" aria-hidden="true">
          <Icon name="radar" size={17} />
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
