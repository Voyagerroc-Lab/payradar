import { useState } from "react";
import Modal from "./Modal";
import { CATEGORIES } from "../lib/format";
import type { BillingCycle, CategoryId, Currency, Payment } from "../types";
import { useI18n } from "../i18n";

interface PaymentFormModalProps {
  initial: Payment | null;
  onClose: () => void;
  onSave: (payment: Payment) => void;
}

export default function PaymentFormModal({
  initial,
  onClose,
  onSave,
}: PaymentFormModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? "TRY");
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
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const parsedPrice = Number(price.replace(",", "."));

    if (!trimmedName) return setError(t("form.error.name"));
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0)
      return setError(t("form.error.amount"));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextPaymentDate))
      return setError(t("form.error.date"));

    onSave({
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
    });
  }

  return (
    <Modal title={initial ? t("form.editTitle") : t("form.newTitle")} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>{t("form.name")}</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("form.namePlaceholder")}
            autoFocus
            maxLength={60}
          />
        </label>

        <div className="form-row">
          <label className="field">
            <span>{t("form.amount")}</span>
            <input
              className="input"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="149,99"
              maxLength={12}
            />
          </label>

          <label className="field">
            <span>{t("form.currency")}</span>
            <select
              className="input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
            >
              <option value="TRY">₺ TRY</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>
          </label>
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

        <label className="field">
          <span>{isTrial ? t("form.trialEndDate") : t("form.nextDate")}</span>
          <input
            className="input"
            type="date"
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

        {error && <p className="form-error">{error}</p>}

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
