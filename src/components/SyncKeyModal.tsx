import { useState } from "react";
import Modal from "./Modal";
import { useI18n } from "../i18n";

interface SyncKeyModalProps {
  onClose: () => void;
  /** Anahtarı uygular; geçersizse false döner. */
  onApply: (key: string) => Promise<boolean>;
}

/**
 * Buluttaki veri bu cihazda bilinmeyen bir anahtarla şifrelenmişse gösterilir.
 * Kullanıcı diğer cihazındaki kurtarma anahtarını girerek verisini açar.
 */
export default function SyncKeyModal({ onClose, onApply }: SyncKeyModalProps) {
  const { t } = useI18n();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleApply() {
    if (!key.trim()) return;
    setBusy(true);
    const ok = await onApply(key.trim());
    setBusy(false);
    if (!ok) setError(t("account.syncKeyInvalid"));
  }

  return (
    <Modal title={t("account.syncKeyTitle")} onClose={onClose}>
      <div className="form">
        <p className="field-hint">{t("account.syncKeyNeeded")}</p>
        <label className="field">
          <span>{t("account.syncKeyTitle")}</span>
          <input
            className="input"
            name="recovery-key"
            autoComplete="off"
            spellCheck={false}
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setError("");
            }}
            placeholder={t("account.syncKeyPlaceholder")}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions security-actions">
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>
            {t("action.cancel")}
          </button>
          <button className="btn btn-primary" onClick={() => void handleApply()} disabled={busy}>
            {t("account.syncKeyApply")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
