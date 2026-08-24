import { CATEGORIES, CURRENCY_SYMBOL, formatDateTR, localeFor } from "../lib/format";
import { findGuide } from "../data/guides";
import type { Payment } from "../types";
import { useI18n } from "../i18n";
import type { TranslationKey } from "../i18n/dict";

interface PaymentCardProps {
  payment: Payment;
  onEdit: () => void;
  onDelete: () => void;
  onShowGuide: () => void;
  onShowHistory?: () => void;
  onAdvance?: () => void;
}

const canShare = typeof navigator !== "undefined" && "share" in navigator;

export default function PaymentCard({
  payment,
  onEdit,
  onDelete,
  onShowGuide,
  onShowHistory,
  onAdvance,
}: PaymentCardProps) {
  const { t, lang } = useI18n();
  const category = CATEGORIES[payment.categoryId] ?? CATEGORIES.diger;
  const days = daysLeft(payment.nextPaymentDate);
  const badge = badgeFor(days, t);
  // Rehber: bilinen bir servis eşleşmesi varsa ya da abonelik kategorisindeyse göster
  const hasGuide = Boolean(findGuide(payment.name)) || payment.categoryId === "abonelik";

  async function handleShare() {
    const cycle = t(`suffix.${payment.billingCycle}` as TranslationKey);
    const text = payment.notes
      ? `${payment.name}: ${formatPrice(payment.price, payment.currency, lang)}${cycle}\n${payment.notes}`
      : `${payment.name}: ${formatPrice(payment.price, payment.currency, lang)}${cycle}`;
    try {
      await navigator.share({ title: payment.name, text });
    } catch {
      /* kullanıcı paylaşımı iptal etti; sessizce geç */
    }
  }

  return (
    <article
      className="card sub-card"
      style={{ borderLeft: `4px solid ${category.color}` }}
    >
      <div className="sub-avatar" style={{ background: category.color }} aria-hidden="true">
        <span>{payment.name.charAt(0).toLocaleUpperCase("tr-TR")}</span>
        <small>{category.emoji}</small>
      </div>

      <div className="sub-info">
        <div className="sub-title-row">
          <h2 title={payment.name}>{payment.name}</h2>
          <span className="chip" style={{ borderColor: category.color }}>
            <span aria-hidden="true">{category.emoji}</span> {t(category.labelKey)}
          </span>
          {payment.isTrial && days >= 0 && (
            <span className="chip chip-trial">🎁 {t("card.trial")}</span>
          )}
        </div>
        <p className="sub-price">
          {formatPrice(payment.price, payment.currency, lang)}
          <span> {t(`suffix.${payment.billingCycle}` as TranslationKey)}</span>
        </p>
        <p className="sub-date">
          {t("card.nextPayment")} {formatDateTR(payment.nextPaymentDate, lang)} ·{" "}
          {payment.isTrial && days >= 0
            ? days === 0
              ? t("card.trialChargeToday")
              : t("card.trialCharge", { n: days })
            : badge.text}
        </p>
        {payment.categoryId === "kredi" &&
          (payment.bankName || payment.currentInstallment != null) && (
            <p className="sub-detail-chip detail-kredi">
              {payment.bankName ? `🏦 ${payment.bankName}` : "🏦"}
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
              {payment.checkNumber ? `📜 No: ${payment.checkNumber}` : "📜"}
              {payment.checkNumber && payment.payee ? ` • ${payment.payee}` : payment.payee ?? ""}
            </p>
          )}
        {payment.notes && <p className="sub-notes">{payment.notes}</p>}
      </div>

      <div className="sub-actions">
        <span className={`badge ${badge.className}`} title={badge.text} aria-label={badge.text}>
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
            📈
          </button>
        )}
        {canShare && (
          <button
            className="icon-btn"
            onClick={() => void handleShare()}
            aria-label={t("aria.share", { name: payment.name })}
            title={t("aria.share", { name: payment.name })}
          >
            📤
          </button>
        )}
        {onAdvance && days <= 0 && (
          <button
            className="icon-btn"
            onClick={onAdvance}
            aria-label={t("card.advance")}
            title={t("card.advance")}
          >
            ✅
          </button>
        )}
        <button
          className="icon-btn"
          onClick={onEdit}
          aria-label={t("aria.edit", { name: payment.name })}
        >
          ✏️
        </button>
        <button
          className="icon-btn danger"
          onClick={onDelete}
          aria-label={t("aria.delete", { name: payment.name })}
        >
          🗑️
        </button>
      </div>
    </article>
  );
}

function daysLeft(iso: string): number {
  const target = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function formatPrice(
  price: number,
  currency: keyof typeof CURRENCY_SYMBOL,
  lang: "tr" | "en" | "ms",
): string {
  return new Intl.NumberFormat(localeFor(lang), {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price);
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
