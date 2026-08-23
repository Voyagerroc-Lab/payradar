import { useState } from "react";
import { useI18n } from "../i18n";

interface LockScreenProps {
  onUnlock: (pin: string) => Promise<boolean>;
  onWipe: () => void;
}

export default function LockScreen({ onUnlock, onWipe }: LockScreenProps) {
  const { t } = useI18n();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin || busy) return;
    setBusy(true);
    const ok = await onUnlock(pin);
    setBusy(false);
    if (!ok) {
      setError(true);
      setPin("");
    }
  }

  return (
    <div className="lock-screen">
      <form className="lock-box card" onSubmit={handleSubmit}>
        <span className="brand-icon lock-icon">📡</span>
        <h1>PayRadar</h1>
        <p className="lock-subtitle">{t("lock.enterPin")}</p>

        <input
          className={`input lock-input ${error ? "lock-error" : ""}`}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          maxLength={8}
          value={pin}
          disabled={busy}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ""));
            setError(false);
          }}
          aria-label={t("lock.enterPin")}
        />

        <button className="btn btn-primary lock-btn" type="submit" disabled={busy || !pin}>
          {busy ? t("lock.verifying") : `🔓 ${t("lock.unlock")}`}
        </button>

        {error && <p className="form-error">{t("lock.wrongPin")}</p>}

        <button
          type="button"
          className="lock-wipe"
          onClick={() => {
            if (window.confirm(t("lock.wipeConfirmText"))) onWipe();
          }}
        >
          {t("lock.forgot")}
        </button>
      </form>
    </div>
  );
}
