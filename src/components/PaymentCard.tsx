import {
  CATEGORIES,
  completesOnAdvance,
  daysUntil,
  dueDateOf,
  formatDateTR,
  formatMoney,
  localeFor,
} from "../lib/format";
import { convert, type FxTable, type LegacyRates } from "../lib/fx";
import { findGuide } from "../data/guides";
import type { Currency, Payment } from "../types";
import { useI18n } from "../i18n";
import type { TranslationKey } from "../i18n/dict";
import { Icon } from "./icons";

interface PaymentCardProps {
  payment: Payment;
  /** Ayarlar'daki gösterim birimi: tutar bu birime çevrilerek gösterilir */
  displayCurrency: Currency;
  fx: FxTable | null;
  legacyRates: LegacyRates;
  onEdit: () => void;
  onDelete: () => void;
  onShowGuide: () => void;
  onShowHistory?: () => void;
  onAdvance?: () => void;
  onReopen?: () => void;
}

/** "Ödendi" düğmesinin vadeden kaç gün önce görünmeye başladığı.
 *  Kirasını üç gün erken ödeyen kullanıcı da dönemi ilerletebilmeli. */
const ADVANCE_WINDOW_DAYS = 5;

const canShare = typeof navigator !== "undefined" && "share" in navigator;

export default function PaymentCard({
  payment,
  displayCurrency,
  fx,
  legacyRates,
  onEdit,
  onDelete,
  onShowGuide,
  onShowHistory,
  onAdvance,
  onReopen,
}: PaymentCardProps) {
  const { t, lang } = useI18n();
  const shownPrice = formatMoney(
    convert(payment.price, payment.currency, displayCurrency, fx, legacyRates),
    displayCurrency,
    lang,
  );
  const category = CATEGORIES[payment.categoryId] ?? CATEGORIES.diger;
  const completed = payment.isCompleted === true;
  const days = daysUntil(dueDateOf(payment));
  const badge = completed
    ? {
        short: t("card.completedShort"),
        text: t("card.completed"),
        className: "badge-done",
      }
    : badgeFor(days, t);
  // Aciliyet, kartın sahnedeki derinliğini belirler (styles.css > 3B DERİNLİK).
  // Arşivlenmiş kalem hiç aciliyet taşımaz: sahnenin en arkasına düşer.
  const urgency = completed
    ? "done"
    : days < 0
      ? "overdue"
      : days === 0
        ? "today"
        : days <= 7
          ? "soon"
          : "later";
  // Son taksit / çek-senet "Ödendi"si kalemi kapatır; bunu düğmenin adı söyler
  const advanceCloses = completesOnAdvance(payment);
  const advanceLabel = advanceCloses ? t("card.complete") : t("card.advance");
  // Rehber: bilinen bir servis eşleşmesi varsa ya da abonelik kategorisindeyse göster
  const hasGuide = Boolean(findGuide(payment.name)) || payment.categoryId === "abonelik";

  async function handleShare() {
    const cycle = t(`suffix.${payment.billingCycle}` as TranslationKey);
    const text = payment.notes
      ? `${payment.name}: ${shownPrice}${cycle}\n${payment.notes}`
      : `${payment.name}: ${shownPrice}${cycle}`;
    try {
      await navigator.share({ title: payment.name, text });
    } catch {
      /* kullanıcı paylaşımı iptal etti; sessizce geç */
    }
  }

  return (
    <article
      className={`card sub-card${completed ? " is-completed" : ""}`}
      data-urgency={urgency}
      /* Mantıksal kenar: Arapça'da (dir=rtl) renk şeridi metnin başladığı
         tarafta, yani sağda kalır */
      style={{ borderInlineStart: `4px solid ${category.color}` }}
    >
      <div
        className="sub-avatar"
        style={{ background: category.color, color: category.ink }}
        aria-hidden="true"
      >
        <span>{payment.name.charAt(0).toLocaleUpperCase(localeFor(lang))}</span>
        <small style={{ color: category.color }}>
          <Icon name={category.icon} size={12} />
        </small>
      </div>

      <div className="sub-info">
        {/* Ad kendi satırının tamamını alır: "Netflix" gibi kısa adlar da,
            uzun fatura adları da kırpılmadan okunur. Kategori ve deneme
            etiketleri adın yanından alınıp tutarın yanına, mikro ölçeğe
            indirildi — kartta okunacak ilk iki şey ad ve tutardır. */}
        <h2 className="sub-name" title={payment.name}>
          {payment.name}
        </h2>
        <div className="sub-meta">
          <p className="sub-price">
            {shownPrice}
            <span> {t(`suffix.${payment.billingCycle}` as TranslationKey)}</span>
          </p>
          <p className="sub-tags">
            <span className="tag">
              <i className="tag-dot" style={{ background: category.color }} aria-hidden="true" />
              {t(category.labelKey)}
            </span>
            {payment.isTrial && days >= 0 && (
              <span className="tag tag-trial">
                <Icon name="gift" size={10} /> {t("card.trial")}
              </span>
            )}
          </p>
        </div>
        <p className="sub-date">
          {t("card.nextPayment")}{" "}
          <span className="mono-data">{formatDateTR(payment.nextPaymentDate, lang)}</span> ·{" "}
          {payment.isTrial && days >= 0
            ? days === 0
              ? t("card.trialChargeToday")
              : t("card.trialCharge", { n: days })
            : badge.text}
        </p>
        {payment.categoryId === "kredi" &&
          (payment.bankName || payment.currentInstallment != null) && (
            <p className="sub-detail-chip detail-kredi">
              <Icon name="bank" size={11} />
              {payment.bankName ? ` ${payment.bankName}` : ""}
              {payment.currentInstallment != null &&
                payment.totalInstallments != null && (
                  <>
                    {" • "}
                    {t("form.installmentBadge", {
                      current: payment.currentInstallment,
                      total: payment.totalInstallments,
                    })}
                  </>
                )}
            </p>
          )}
        {payment.categoryId === "cek_senet" &&
          (payment.checkNumber || payment.payee) && (
            <p className="sub-detail-chip detail-cek">
              <Icon name="scroll" size={11} />
              {payment.checkNumber ? ` ${t("card.checkNo")} ${payment.checkNumber}` : ""}
              {payment.checkNumber && payment.payee ? ` • ${payment.payee}` : payment.payee ?? ""}
            </p>
          )}
        {payment.notes && <p className="sub-notes">{payment.notes}</p>}
      </div>

      <div className="sub-actions">
        <span
          className={`badge ${badge.className}${days >= 0 && days <= 3 ? " badge-ping" : ""}`}
          title={badge.text}
          aria-label={badge.text}
        >
          {badge.short}
        </span>
        {hasGuide && (
          <button className="btn btn-secondary" onClick={onShowGuide}>
            {t("card.guide")}
          </button>
        )}
        {onShowHistory && (
          <button
            className="icon-btn"
            onClick={onShowHistory}
            aria-label={t("aria.history", { name: payment.name })}
            title={t("aria.history", { name: payment.name })}
          >
            <Icon name="chart" />
          </button>
        )}
        {canShare && (
          <button
            className="icon-btn"
            onClick={() => void handleShare()}
            aria-label={t("aria.share", { name: payment.name })}
            title={t("aria.share", { name: payment.name })}
          >
            <Icon name="share" />
          </button>
        )}
        {onAdvance && !completed && days <= ADVANCE_WINDOW_DAYS && (
          <button
            className="icon-btn"
            onClick={onAdvance}
            aria-label={advanceLabel}
            title={advanceLabel}
          >
            <Icon name="check" />
          </button>
        )}
        {onReopen && completed && (
          <button
            className="icon-btn"
            onClick={onReopen}
            aria-label={t("card.reopen")}
            title={t("card.reopen")}
          >
            <Icon name="refresh" />
          </button>
        )}
        <button
          className="icon-btn"
          onClick={onEdit}
          aria-label={t("aria.edit", { name: payment.name })}
          title={t("aria.edit", { name: payment.name })}
        >
          <Icon name="pencil" />
        </button>
        <button
          className="icon-btn danger"
          onClick={onDelete}
          aria-label={t("aria.delete", { name: payment.name })}
          title={t("aria.delete", { name: payment.name })}
        >
          <Icon name="trash" />
        </button>
      </div>
    </article>
  );
}

function badgeFor(
  days: number,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
): { short: string; text: string; className: string } {
  const daysText = t("time.daysLeft", { n: days });
  if (days < 0)
    return { short: t("card.overdueShort"), text: t("card.overdue"), className: "badge-danger" };
  if (days === 0)
    return { short: t("card.todayShort"), text: t("time.renewsToday"), className: "badge-danger" };
  if (days <= 7)
    return {
      short: `${days}${t("card.dayUnit")}`,
      text: daysText,
      className: "badge-warn",
    };
  return {
    short: `${days}${t("card.dayUnit")}`,
    text: daysText,
    className: "badge-ok",
  };
}
