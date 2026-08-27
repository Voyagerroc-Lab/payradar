import { useState } from "react";
import Modal from "./Modal";
import { mapAuthErrorKey, sendPasswordReset } from "../lib/cloud";
import { useI18n } from "../i18n";
import type { TranslationKey } from "../i18n/dict";
import { Icon } from "./icons";

interface AuthModalProps {
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<string | null>;
  onSignUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error: string | null; needsConfirm: boolean }>;
  onSignInPhone: (phone: string, password: string) => Promise<string | null>;
  onSignUpPhone: (
    phone: string,
    password: string,
  ) => Promise<{ error: string | null; needsOtp: boolean }>;
  onVerifyPhoneOtp: (phone: string, token: string) => Promise<string | null>;
  onGoogle: () => Promise<string | null>;
}

type Tab = "signin" | "signup";
type Method = "email" | "phone";

export default function AuthModal({
  onClose,
  onSignIn,
  onSignUp,
  onSignInPhone,
  onSignUpPhone,
  onVerifyPhoneOtp,
  onGoogle,
}: AuthModalProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("signin");
  const [method, setMethod] = useState<Method>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [otpPendingPhone, setOtpPendingPhone] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");

  function localizeError(raw: string): string {
    const key = mapAuthErrorKey(raw);
    return key ? t(key as TranslationKey) : t("account.error.generic", { msg: raw });
  }

  function switchTab(next: Tab) {
    setTab(next);
    setError("");
    setInfo("");
  }

  function validate(): string | null {
    if (tab === "signup" && !name.trim()) return t("auth.error.nameEmpty");
    if (method === "email") {
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return t("auth.error.invalidEmail");
    } else if (!/^\+[1-9]\d{7,14}$/.test(phone.trim())) {
      return t("account.error.invalidPhone");
    }
    if (!password) return t("account.error.missing");
    // Uzunluk kuralı yalnızca yeni hesapta; mevcut hesabın şifresine sunucu karar verir
    if (tab === "signup" && password.length < 6) return t("auth.error.shortPassword");
    if (tab === "signup" && password !== confirmPassword)
      return t("auth.error.passwordMismatch");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const invalid = validate();
    if (invalid) return setError(invalid);

    setBusy(true);
    let raw: string | null = null;
    if (method === "email") {
      if (tab === "signin") {
        raw = await onSignIn(email.trim(), password);
      } else {
        const result = await onSignUp(email.trim(), password, name.trim());
        raw = result.error;
        if (!raw && result.needsConfirm) {
          // Oturum henüz yok: modal açık kalsın, kullanıcı e-postasını doğrulasın
          setBusy(false);
          setError("");
          setInfo(t("account.needsConfirm"));
          setTab("signin");
          return;
        }
      }
    } else if (tab === "signin") {
      raw = await onSignInPhone(phone.trim(), password);
    } else {
      const result = await onSignUpPhone(phone.trim(), password);
      raw = result.error;
      if (!raw && result.needsOtp) {
        setOtpPendingPhone(phone.trim());
        setOtpCode("");
        setBusy(false);
        setError("");
        return;
      }
    }
    setBusy(false);
    if (raw) return setError(localizeError(raw));
    onClose();
  }

  async function handleVerifyOtp() {
    if (!otpPendingPhone) return;
    if (!/^\d{4,8}$/.test(otpCode)) return setError(t("account.error.invalidOtp"));
    setBusy(true);
    const raw = await onVerifyPhoneOtp(otpPendingPhone, otpCode.trim());
    setBusy(false);
    if (raw) return setError(localizeError(raw));
    onClose();
  }

  async function handleForgotPassword() {
    const target = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(target)) {
      setError(t("auth.error.invalidEmail"));
      return;
    }
    setBusy(true);
    const result = await sendPasswordReset(target);
    setBusy(false);
    if (!result.ok) {
      setError(localizeError(result.error ?? "error"));
      return;
    }
    setError("");
    setInfo(t("auth.resetSent"));
  }

  async function handleGoogle() {
    setBusy(true);
    const raw = await onGoogle();
    setBusy(false);
    if (raw) setError(localizeError(raw));
    // Başarıda sayfa Google'a yönlenir; modalı kapatmaya gerek kalmaz
  }

  if (otpPendingPhone) {
    return (
      <Modal title={t("auth.dialogTitle")} onClose={onClose}>
        <div className="form">
          <p className="field-hint">{t("account.otpHint", { phone: otpPendingPhone })}</p>
          <label className="field">
            <span>{t("account.otpCode")}</span>
            <input
              className="input"
              inputMode="numeric"
              name="otp"
              spellCheck={false}
              autoComplete="one-time-code"
              maxLength={8}
              value={otpCode}
              onChange={(e) => {
                setOtpCode(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
            />
          </label>
          {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
          <div className="form-actions security-actions">
            <button
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => {
                setOtpPendingPhone(null);
                setOtpCode("");
                setError("");
              }}
            >
              {t("action.cancel")}
            </button>
            <button className="btn btn-primary" disabled={busy} onClick={() => void handleVerifyOtp()}>
              {t("account.verifyOtp")}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={t("auth.dialogTitle")} onClose={onClose}>
      <div className="auth-tabs" role="tablist" aria-label={t("auth.dialogTitle")}>
        <button
          type="button"
          className={`auth-tab ${tab === "signin" ? "active" : ""}`}
          role="tab"
          aria-selected={tab === "signin"}
          onClick={() => switchTab("signin")}
        >
          {t("auth.tabSignIn")}
        </button>
        <button
          type="button"
          className={`auth-tab ${tab === "signup" ? "active" : ""}`}
          role="tab"
          aria-selected={tab === "signup"}
          onClick={() => switchTab("signup")}
        >
          {t("auth.tabSignUp")}
        </button>
      </div>

      <p className="field-hint">
        {tab === "signin" ? t("auth.signInSubtitle") : t("auth.signUpSubtitle")}
      </p>

      <form className="form" onSubmit={(e) => void handleSubmit(e)}>
        {tab === "signup" && (
          <label className="field">
            <span>{t("auth.name")}</span>
            <input
              className="input"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder={t("auth.namePlaceholder")}
              maxLength={60}
            />
          </label>
        )}

        <div className="chips">
          <button
            type="button"
            className={`chip-btn ${method === "email" ? "active" : ""}`}
            aria-pressed={method === "email"}
            onClick={() => {
              setMethod("email");
              setError("");
            }}
          >
            {t("account.methodEmail")}
          </button>
          <button
            type="button"
            className={`chip-btn ${method === "phone" ? "active" : ""}`}
            aria-pressed={method === "phone"}
            onClick={() => {
              setMethod("phone");
              setError("");
            }}
          >
            {t("account.methodPhone")}
          </button>
        </div>

        {method === "email" ? (
          <label className="field">
            <span>{t("auth.email")}</span>
            <input
              className="input"
              type="email"
              name="email"
              spellCheck={false}
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder={t("auth.emailPlaceholder")}
            />
          </label>
        ) : (
          <label className="field">
            <span>{t("account.phone")}</span>
            <input
              className="input"
              type="tel"
              name="phone"
              spellCheck={false}
              autoComplete="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError("");
              }}
              placeholder="+905551234567"
            />
          </label>
        )}

        <label className="field">
          <span>{t("auth.password")}</span>
          <div className="password-wrap">
            <input
              className="input"
              type={showPassword ? "text" : "password"}
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder={t("auth.passwordPlaceholder")}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              title={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            >
              <Icon name={showPassword ? "eye-off" : "eye"} />
            </button>
          </div>
        </label>

        {tab === "signin" && method === "email" && (
          <button
            type="button"
            className="link-btn forgot-link"
            onClick={() => void handleForgotPassword()}
            disabled={busy}
          >
            {t("auth.forgotPassword")}
          </button>
        )}

        {tab === "signup" && (
          <label className="field">
            <span>{t("auth.confirmPassword")}</span>
            <div className="password-wrap">
              <input
                className="input"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? t("auth.hidePassword") : t("auth.showPassword")}
                title={showConfirm ? t("auth.hidePassword") : t("auth.showPassword")}
              >
                <Icon name={showConfirm ? "eye-off" : "eye"} />
              </button>
            </div>
          </label>
        )}

        <p className="field-hint auth-sync-hint"><Icon name="bulb" size={13} /> {t("auth.syncHint")}</p>

        {info && (
          <p className="field-hint strong-hint" aria-live="polite">
            <Icon name="mail" size={13} /> {info}
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
          {busy ? "…" : tab === "signin" ? t("auth.btnSignIn") : t("auth.btnSignUp")}
        </button>

        {method === "email" && (
          <>
            <div className="auth-divider">
              <span>{t("auth.orDivider")}</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary auth-google"
              disabled={busy}
              onClick={() => void handleGoogle()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                />
              </svg>
              {t("auth.googleSignIn")}
            </button>
          </>
        )}
      </form>
    </Modal>
  );
}
