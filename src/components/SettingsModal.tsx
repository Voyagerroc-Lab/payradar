import { useRef, useState } from "react";
import Modal from "./Modal";
import { requestNotificationPermission } from "../lib/notify";
import type { Language, Prefs, VaultData } from "../types";
import type { CloudUser } from "../lib/cloud";
import { useI18n } from "../i18n";

interface SettingsModalProps {
  prefs: Prefs;
  vault: VaultData;
  onClose: () => void;
  onSavePrefs: (p: Prefs) => void;
  onSaveVault: (v: VaultData) => void;
  onEnableLock: (pin: string) => Promise<boolean>;
  onChangePin: (oldPin: string, newPin: string) => Promise<boolean>;
  onDisableLock: (pin: string) => Promise<boolean>;
  onExportCsv: () => void;
  onImportCsv: (file: File) => void;
  cloudEnabled: boolean;
  cloudUser: CloudUser | null;
  onCloudSignIn: (email: string, password: string) => Promise<string | null>;
  onCloudSignUp: (email: string, password: string) => Promise<string | null>;
  onCloudSignInPhone: (phone: string, password: string) => Promise<string | null>;
  onCloudSignUpPhone: (
    phone: string,
    password: string,
  ) => Promise<{ error: string | null; needsOtp: boolean }>;
  onCloudVerifyPhoneOtp: (phone: string, token: string) => Promise<string | null>;
  onCloudSignOut: () => Promise<void>;
}

const AUTO_LOCK_OPTIONS = [1, 3, 5, 10];

export default function SettingsModal({
  prefs,
  vault,
  onClose,
  onSavePrefs,
  onSaveVault,
  onEnableLock,
  onChangePin,
  onDisableLock,
  onExportCsv,
  onImportCsv,
  cloudEnabled,
  cloudUser,
  onCloudSignIn,
  onCloudSignUp,
  onCloudSignInPhone,
  onCloudSignUpPhone,
  onCloudVerifyPhoneOtp,
  onCloudSignOut,
}: SettingsModalProps) {
  const { t, setLang } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draftPrefs, setDraftPrefs] = useState<Prefs>(prefs);
  const [draftVault, setDraftVault] = useState<VaultData>(vault);

  // Hesap formu
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [authEmail, setAuthEmail] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [otpPendingPhone, setOtpPendingPhone] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");

  // PIN form durumları
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [busy, setBusy] = useState(false);

  function toggleNotifications() {
    if (draftVault.notificationsEnabled) {
      setDraftVault({ ...draftVault, notificationsEnabled: false });
    } else {
      void requestNotificationPermission().then((granted) => {
        if (granted) setDraftVault({ ...draftVault, notificationsEnabled: true });
      });
    }
  }

  async function handleEnable() {
    if (!isValidPin(newPin) || newPin !== confirmPin) {
      setPinError(t("security.error.mismatch"));
      return;
    }
    setBusy(true);
    const ok = await onEnableLock(newPin);
    setBusy(false);
    if (ok) {
      setDraftPrefs({ ...draftPrefs, lockEnabled: true });
      clearPinFields();
    }
  }

  async function handleChange() {
    if (!isValidPin(newPin)) {
      setPinError(t("security.error.mismatch"));
      return;
    }
    setBusy(true);
    const ok = await onChangePin(currentPin, newPin);
    setBusy(false);
    if (ok) {
      clearPinFields();
    } else {
      setPinError(t("security.error.wrongPin"));
    }
  }

  async function handleDisable() {
    setBusy(true);
    const ok = await onDisableLock(currentPin);
    setBusy(false);
    if (ok) {
      setDraftPrefs({ ...draftPrefs, lockEnabled: false });
      clearPinFields();
    } else {
      setPinError(t("security.error.wrongPin"));
    }
  }

  function clearPinFields() {
    setNewPin("");
    setConfirmPin("");
    setCurrentPin("");
    setPinError("");
  }

  async function runAuth(
    action: (email: string, password: string) => Promise<string | null>,
  ) {
    if (!authEmail || !authPassword) {
      setAuthError(t("account.error.missing"));
      return;
    }
    setAuthBusy(true);
    const error = await action(authEmail.trim(), authPassword);
    setAuthBusy(false);
    setAuthError(error ? t("account.error.generic", { msg: error }) : "");
    if (!error) {
      setAuthEmail("");
      setAuthPassword("");
    }
  }

  async function runPhoneSignIn() {
    if (!authPhone || !authPassword) {
      setAuthError(t("account.error.missing"));
      return;
    }
    if (!isValidPhone(authPhone)) {
      setAuthError(t("account.error.invalidPhone"));
      return;
    }
    setAuthBusy(true);
    const error = await onCloudSignInPhone(authPhone.trim(), authPassword);
    setAuthBusy(false);
    setAuthError(error ? t("account.error.generic", { msg: error }) : "");
    if (!error) {
      setAuthPhone("");
      setAuthPassword("");
    }
  }

  async function runPhoneSignUp() {
    if (!authPhone || !authPassword) {
      setAuthError(t("account.error.missing"));
      return;
    }
    if (!isValidPhone(authPhone)) {
      setAuthError(t("account.error.invalidPhone"));
      return;
    }
    setAuthBusy(true);
    const { error, needsOtp } = await onCloudSignUpPhone(authPhone.trim(), authPassword);
    setAuthBusy(false);
    if (error) {
      setAuthError(t("account.error.generic", { msg: error }));
      return;
    }
    setAuthError("");
    if (needsOtp) {
      setOtpPendingPhone(authPhone.trim());
      setOtpCode("");
    } else {
      setAuthPhone("");
      setAuthPassword("");
    }
  }

  async function runVerifyOtp() {
    if (!otpPendingPhone) return;
    if (!/^\d{4,8}$/.test(otpCode)) {
      setAuthError(t("account.error.invalidOtp"));
      return;
    }
    setAuthBusy(true);
    const error = await onCloudVerifyPhoneOtp(otpPendingPhone, otpCode.trim());
    setAuthBusy(false);
    setAuthError(error ? t("account.error.generic", { msg: error }) : "");
    if (!error) {
      setOtpPendingPhone(null);
      setOtpCode("");
      setAuthPhone("");
      setAuthPassword("");
    }
  }

  return (
    <Modal title={t("settings.title")} onClose={onClose} wide>
      <div className="form">
        <label className="field">
          <span>{t("settings.language")}</span>
          <select
            className="input"
            value={draftPrefs.language}
            onChange={(e) => {
              const lang = e.target.value as Language;
              setDraftPrefs({ ...draftPrefs, language: lang });
              setLang(lang);
            }}
          >
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
        </label>

        <label className="field">
          <span>{t("settings.reminderQuestion")}</span>
          <select
            className="input"
            value={draftVault.reminderDays}
            onChange={(e) =>
              setDraftVault({ ...draftVault, reminderDays: Number(e.target.value) })
            }
          >
            {[1, 2, 3, 5, 7].map((n) => (
              <option key={n} value={n}>
                {t("settings.daysBefore", { n })}
              </option>
            ))}
          </select>
        </label>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={draftVault.notificationsEnabled}
            onChange={toggleNotifications}
          />
          <span>{t("settings.notifications")}</span>
        </label>

        <div className="form-row">
          <label className="field">
            <span>{t("settings.usdRate")}</span>
            <input
              className="input"
              inputMode="decimal"
              value={String(draftVault.usdTry)}
              onChange={(e) =>
                setDraftVault({
                  ...draftVault,
                  usdTry: Number(e.target.value.replace(",", ".")) || 0,
                })
              }
            />
          </label>
          <label className="field">
            <span>{t("settings.eurRate")}</span>
            <input
              className="input"
              inputMode="decimal"
              value={String(draftVault.eurTry)}
              onChange={(e) =>
                setDraftVault({
                  ...draftVault,
                  eurTry: Number(e.target.value.replace(",", ".")) || 0,
                })
              }
            />
          </label>
        </div>
        <p className="field-hint">{t("settings.ratesHint")}</p>

        <label className="field">
          <span>{t("settings.theme")}</span>
          <select
            className="input"
            value={draftPrefs.theme}
            onChange={(e) =>
              setDraftPrefs({ ...draftPrefs, theme: e.target.value as Prefs["theme"] })
            }
          >
            <option value="auto">{t("theme.auto")}</option>
            <option value="light">{t("theme.light")}</option>
            <option value="dark">{t("theme.dark")}</option>
          </select>
        </label>

        {/* ---------- Hesap ---------- */}
        <h3 className="section-title">{t("account.title")}</h3>
        {!cloudEnabled ? (
          <p className="field-hint">{t("account.disabledHint")}</p>
        ) : cloudUser ? (
          <>
            <p className="field-hint strong-hint">
              ✅{" "}
              {t("account.signedInAs", {
                identity: (cloudUser.email ?? cloudUser.phone ?? "") as string,
              })}
            </p>
            <div className="form-actions">
              <button
                className="btn btn-secondary"
                disabled={authBusy}
                onClick={() => void onCloudSignOut()}
              >
                {t("account.signOut")}
              </button>
            </div>
          </>
        ) : otpPendingPhone ? (
          <>
            <p className="field-hint">
              {t("account.otpHint", { phone: otpPendingPhone })}
            </p>
            <label className="field">
              <span>{t("account.otpCode")}</span>
              <input
                className="input"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              />
            </label>
            {authError && <p className="form-error">{authError}</p>}
            <div className="form-actions security-actions">
              <button
                className="btn btn-secondary"
                disabled={authBusy}
                onClick={() => {
                  setOtpPendingPhone(null);
                  setOtpCode("");
                  setAuthError("");
                }}
              >
                {t("action.cancel")}
              </button>
              <button
                className="btn btn-primary"
                disabled={authBusy}
                onClick={() => void runVerifyOtp()}
              >
                {t("account.verifyOtp")}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="field-hint">{t("account.hint")}</p>
            <div className="chips">
              <button
                type="button"
                className={`chip-btn ${authMethod === "email" ? "active" : ""}`}
                onClick={() => {
                  setAuthMethod("email");
                  setAuthError("");
                }}
              >
                {t("account.methodEmail")}
              </button>
              <button
                type="button"
                className={`chip-btn ${authMethod === "phone" ? "active" : ""}`}
                onClick={() => {
                  setAuthMethod("phone");
                  setAuthError("");
                }}
              >
                {t("account.methodPhone")}
              </button>
            </div>
            {authMethod === "email" ? (
              <label className="field">
                <span>{t("account.email")}</span>
                <input
                  className="input"
                  type="email"
                  autoComplete="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="ornek@mail.com"
                />
              </label>
            ) : (
              <label className="field">
                <span>{t("account.phone")}</span>
                <input
                  className="input"
                  type="tel"
                  autoComplete="tel"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  placeholder="+905551234567"
                />
              </label>
            )}
            <label className="field">
              <span>{t("account.password")}</span>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                minLength={6}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </label>
            {authError && <p className="form-error">{authError}</p>}
            <div className="form-actions security-actions">
              <button
                className="btn btn-secondary"
                disabled={authBusy}
                onClick={() =>
                  void (authMethod === "email" ? runAuth(onCloudSignUp) : runPhoneSignUp())
                }
              >
                {t("account.signUp")}
              </button>
              <button
                className="btn btn-primary"
                disabled={authBusy}
                onClick={() =>
                  void (authMethod === "email" ? runAuth(onCloudSignIn) : runPhoneSignIn())
                }
              >
                {t("account.signIn")}
              </button>
            </div>
          </>
        )}

        {/* ---------- Veri Yedekleme ---------- */}
        <h3 className="section-title">{t("data.title")}</h3>
        <p className="field-hint">{t("data.importHint")}</p>
        <div className="form-row">
          <button className="btn btn-secondary" onClick={onExportCsv}>
            ⬇️ {t("data.exportBtn")}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            ⬆️ {t("data.importBtn")}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImportCsv(file);
            e.target.value = "";
          }}
        />

        {/* ---------- Güvenlik ---------- */}
        <h3 className="section-title">{t("security.title")}</h3>

        {!draftPrefs.lockEnabled ? (
          <>
            <p className="field-hint">{t("security.offHint")}</p>
            <p className="field-hint strong-hint">🔓 {t("security.enableTitle")}</p>
            <div className="form-row">
              <label className="field">
                <span>{t("security.newPin")}</span>
                <input
                  className="input"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={8}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                />
              </label>
              <label className="field">
                <span>{t("security.confirmPin")}</span>
                <input
                  className="input"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={8}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                />
              </label>
            </div>
            {pinError && <p className="form-error">{pinError}</p>}
            <div className="form-actions">
              <button className="btn btn-primary" disabled={busy} onClick={() => void handleEnable()}>
                🔒 {t("security.enableTitle")}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="field-hint">{t("security.activeHint")}</p>

            <label className="field">
              <span>{t("security.autoLock")}</span>
              <select
                className="input"
                value={draftPrefs.autoLockMinutes}
                onChange={(e) =>
                  setDraftPrefs({ ...draftPrefs, autoLockMinutes: Number(e.target.value) })
                }
              >
                {AUTO_LOCK_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {t("autolock.minutes", { n })}
                  </option>
                ))}
                <option value={0}>{t("autolock.never")}</option>
              </select>
            </label>

            <div className="form-row">
              <label className="field">
                <span>{t("security.currentPin")}</span>
                <input
                  className="input"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={8}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                />
              </label>
              <label className="field">
                <span>{t("security.newPin")}</span>
                <input
                  className="input"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={8}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                />
              </label>
            </div>
            {pinError && <p className="form-error">{pinError}</p>}
            <div className="form-actions security-actions">
              <button
                className="btn btn-danger"
                disabled={busy}
                onClick={() => void handleDisable()}
              >
                {t("security.disableBtn")}
              </button>
              <button
                className="btn btn-secondary"
                disabled={busy || !newPin}
                onClick={() => void handleChange()}
              >
                {t("security.changePinBtn")}
              </button>
            </div>
          </>
        )}

        <div className="form-actions main-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            {t("action.cancel")}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onSaveBoth(draftPrefs, draftVault)}
          >
            {t("action.save")}
          </button>
        </div>
      </div>
    </Modal>
  );

  function onSaveBoth(p: Prefs, v: VaultData) {
    onSavePrefs(p);
    onSaveVault(v);
  }
}

function isValidPin(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

/** E.164: + ile başlar, 0 olmayan bir rakamla devam eder, toplam 8-15 hane. */
function isValidPhone(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone.trim());
}
