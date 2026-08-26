import { useRef, useState } from "react";
import Modal from "./Modal";
import { CATEGORIES, parseAmount, parseInstallment, sanitizeCategoryFields } from "../lib/format";
import type { BillingCycle, CategoryId, Currency, Payment } from "../types";
import { useI18n } from "../i18n";

interface PaymentFormModalProps {
  initial: Payment | null;
  /** Ayarlar'daki gösterim para birimi: yeni ödemeler bu birimde girilir */
  displayCurrency: Currency;
  onClose: () => void;
  onSave: (payment: Payment) => void;
}

export default function PaymentFormModal({
  initial,
  displayCurrency,
  onClose,
  onSave,
}: PaymentFormModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  // Birim ödeme başına seçilmez: yeni ödeme Ayarlar'daki gösterim biriminde
  // girilir; düzenlemede tutar, ödemenin GİRİLDİĞİ birimde kalır (veri bozulmaz)
  const currency: Currency = initial?.currency ?? displayCurrency;
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    initial?.billingCycle ?? "monthly",
  );
  const [nextPaymentDate, setNextPaymentDate] = useState(
    initial?.nextPaymentDate ?? defaultNextMonth(),
  );
  const [categoryId, setCategoryId] = useState<CategoryId>(
    initial?.categoryId ?? "abonelik",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [isTrial, setIsTrial] = useState(initial?.isTrial ?? false);
  const [bankName, setBankName] = useState(initial?.bankName ?? "");
  const [currentInstallment, setCurrentInstallment] = useState(
    initial?.currentInstallment != null ? String(initial.currentInstallment) : "",
  );
  const [totalInstallments, setTotalInstallments] = useState(
    initial?.totalInstallments != null ? String(initial.totalInstallments) : "",
  );
  const [checkNumber, setCheckNumber] = useState(initial?.checkNumber ?? "");
  const [payee, setPayee] = useState(initial?.payee ?? "");
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const parsedPrice = parseAmount(price);

    // Hata durumunda ilgili alana odaklan — ekran okuyucu ve klavye kullanıcısı için
    if (!trimmedName) {
      nameRef.current?.focus();
      return setError(t("form.error.name"));
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      priceRef.current?.focus();
      return setError(t("form.error.amount"));
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextPaymentDate)) {
      dateRef.current?.focus();
      return setError(t("form.error.date"));
    }

    // sanitizeCategoryFields kategoriye ait olmayan alanları düşürür
    onSave(
      sanitizeCategoryFields({
        id: initial?.id ?? crypto.randomUUID(),
        name: trimmedName,
        price: parsedPrice,
        currency,
        billingCycle,
        nextPaymentDate,
        categoryId,
        notes: notes.trim() || undefined,
        createdAt: initial?.createdAt ?? Date.now(),
        isTrial,
        bankName: bankName.trim() || undefined,
        currentInstallment: parseInstallment(currentInstallment),
        totalInstallments: parseInstallment(totalInstallments),
        checkNumber: checkNumber.trim() || undefined,
        payee: payee.trim() || undefined,
      }),
    );
  }

  return (
    <Modal title={initial ? t("form.editTitle") : t("form.newTitle")} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>{t("form.name")}</span>
          <input
            ref={nameRef}
            className="input"
            name="payment-name"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("form.namePlaceholder")}
            maxLength={60}
          />
        </label>

        <div className="form-row">
          <label className="field">
            <span>{t("form.amount")}</span>
            <input
              ref={priceRef}
              className="input"
              name="amount"
              autoComplete="off"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="149,99"
              maxLength={12}
            />
          </label>

          <div className="field">
            <span>{t("form.currency")}</span>
            <span className="input currency-static" aria-label={t("form.currency")}>
              {currency}
            </span>
          </div>
        </div>

        <div className="form-row">
          <label className="field">
            <span>{t("form.cycle")}</span>
            <select
              className="input"
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
            >
              <option value="weekly">{t("cycle.weekly")}</option>
              <option value="monthly">{t("cycle.monthly")}</option>
              <option value="quarterly">{t("cycle.quarterly")}</option>
              <option value="yearly">{t("cycle.yearly")}</option>
            </select>
          </label>

          <label className="field">
            <span>{t("form.category")}</span>
            <select
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value as CategoryId)}
            >
              {(Object.keys(CATEGORIES) as CategoryId[]).map((id) => (
                <option key={id} value={id}>
                  {CATEGORIES[id].emoji} {t(CATEGORIES[id].labelKey)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {categoryId === "kredi" && (
          <>
            <label className="field">
              <span>{t("form.bankName")}</span>
              <input
                className="input"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder={t("form.bankNamePlaceholder")}
                maxLength={60}
              />
            </label>
            <div className="form-row">
              <label className="field">
                <span>{t("form.currentInstallment")}</span>
                <input
                  className="input"
                  inputMode="numeric"
                  value={currentInstallment}
                  onChange={(e) => setCurrentInstallment(e.target.value.replace(/\D/g, ""))}
                  placeholder="12"
                  maxLength={4}
                />
              </label>
              <label className="field">
                <span>{t("form.totalInstallments")}</span>
                <input
                  className="input"
                  inputMode="numeric"
                  value={totalInstallments}
                  onChange={(e) => setTotalInstallments(e.target.value.replace(/\D/g, ""))}
                  placeholder="36"
                  maxLength={4}
                />
              </label>
            </div>
          </>
        )}

        {categoryId === "cek_senet" && (
          <>
            <label className="field">
              <span>{t("form.checkNumber")}</span>
              <input
                className="input"
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                placeholder={t("form.checkNumberPlaceholder")}
                maxLength={40}
              />
            </label>
            <label className="field">
              <span>{t("form.payee")}</span>
              <input
                className="input"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                placeholder={t("form.payeePlaceholder")}
                maxLength={80}
              />
            </label>
          </>
        )}

        <label className="field">
          <span>{isTrial ? t("form.trialEndDate") : t("form.nextDate")}</span>
          <input
            ref={dateRef}
            className="input"
            type="date"
            name="next-payment-date"
            autoComplete="off"
            value={nextPaymentDate}
            onChange={(e) => setNextPaymentDate(e.target.value)}
          />
        </label>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={isTrial}
            onChange={(e) => setIsTrial(e.target.checked)}
          />
          <span>{t("form.isTrial")}</span>
        </label>
        {isTrial && <p className="field-hint">{t("form.isTrialHint")}</p>}

        <label className="field">
          <span>{t("form.notes")}</span>
          <textarea
            className="input"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("form.notesPlaceholder")}
            maxLength={200}
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t("action.cancel")}
          </button>
          <button type="submit" className="btn btn-primary">
            {t("action.save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function defaultNextMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}
