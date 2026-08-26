import { useRef, useState } from "react";
import Modal from "./Modal";
import { requestNotificationPermission } from "../lib/notify";
import { formatMoney, localeFor } from "../lib/format";
import { CURRENCIES, convert, homeCurrency, type FxTable } from "../lib/fx";
import type { Language, Prefs, VaultData } from "../types";
import type { CloudUser } from "../lib/cloud";
import { useI18n } from "../i18n";

interface SettingsModalProps {
  prefs: Prefs;
  vault: VaultData;
  fx: FxTable | null;
  onRefreshFx: () => Promise<boolean>;
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
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onTestNotifications: () => void;
  onLoadDemo: () => void;
  onEraseData: () => void;
}

const AUTO_LOCK_OPTIONS = [1, 3, 5, 10];

export default function SettingsModal({
  prefs,
  vault,
  fx,
  onRefreshFx,
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
  onOpenAuth,
  onOpenProfile,
  onTestNotifications,
  onLoadDemo,
  onEraseData,
}: SettingsModalProps) {
  const { t, setLang } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draftPrefs, setDraftPrefs] = useState<Prefs>(prefs);
  const [draftVault, setDraftVault] = useState<VaultData>(vault);
  const [fxRefreshing, setFxRefreshing] = useState(false);
  // Taslak dile göre önizleme: dil değiştirilirken kur kutusu da o dilin
  // ana para birimini gösterir — kaydetmeden ne olacağı görülür.
  const fxHome = homeCurrency(draftPrefs.language);

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
            <option value="ms">Bahasa Melayu</option>
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

        {draftVault.notificationsEnabled && (
          <button
            type="button"
            className="btn btn-secondary full-width-btn"
            onClick={onTestNotifications}
          >
            {t("settings.testNotifications")}
          </button>
        )}

        <div className="fx-box">
          <div className="fx-box-head">
            <span className="section-title fx-title">{t("settings.ratesTitle")}</span>
            <button
              type="button"
              className="btn btn-secondary fx-refresh"
              disabled={fxRefreshing}
              onClick={() => {
                setFxRefreshing(true);
                void onRefreshFx().finally(() => setFxRefreshing(false));
              }}
            >
              {fxRefreshing ? t("settings.ratesRefreshing") : t("settings.ratesRefresh")}
            </button>
          </div>
          {fx ? (
            <>
              <ul className="fx-rates">
                {CURRENCIES.filter((c) => c !== fxHome).map((c) => (
                  <li key={c}>
                    <span>1 {c}</span>
                    <strong>
                      {formatMoney(convert(1, c, fxHome, fx), fxHome, draftPrefs.language)}
                    </strong>
                  </li>
                ))}
              </ul>
              <p className="field-hint">
                {t("settings.ratesUpdated", {
                  time: new Date(fx.updatedAt).toLocaleString(
                    localeFor(draftPrefs.language),
                    { dateStyle: "medium", timeStyle: "short" },
                  ),
                })}
              </p>
            </>
          ) : (
            <p className="field-hint">{t("settings.ratesNever")}</p>
          )}
          <p className="field-hint">{t("settings.ratesHint")}</p>
        </div>

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
        <h3 className="section-title">{t("auth.profile.title")}</h3>
        {cloudEnabled && draftPrefs.lockEnabled && (
          <p className="field-hint strong-hint"><span aria-hidden="true">⚠️</span> {t("account.cloudNotEncryptedHint")}</p>
        )}
        {!cloudEnabled ? (
          <p className="field-hint">{t("account.disabledHint")}</p>
        ) : cloudUser ? (
          <div className="settings-account-card">
            <span>
              <span aria-hidden="true">☁️</span>{" "}
              {t("account.signedInAs", {
                identity: (cloudUser.email ?? cloudUser.phone ?? "") as string,
              })}
            </span>
            <button className="btn btn-secondary" onClick={onOpenProfile}>
              {t("auth.profile.title")}
            </button>
          </div>
        ) : (
          <div className="settings-account-card">
            <span>{t("auth.signInSubtitle")}</span>
            <button className="btn btn-primary" onClick={onOpenAuth}>
              {t("auth.tabSignIn")}
            </button>
          </div>
        )}

        {/* ---------- Veri Yedekleme ---------- */}
        <h3 className="section-title">{t("data.title")}</h3>
        <p className="field-hint">{t("data.importHint")}</p>
        <div className="form-row">
          <button className="btn btn-secondary" onClick={onExportCsv}>
            <span aria-hidden="true">⬇️</span> {t("data.exportBtn")}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <span aria-hidden="true">⬆️</span> {t("data.importBtn")}
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
        <button
          type="button"
          className="btn btn-secondary full-width-btn"
          onClick={onLoadDemo}
        >
          <span aria-hidden="true">✨</span> {t("empty.tryDemo")}
        </button>
        <button
          type="button"
          className="btn btn-danger full-width-btn"
          onClick={onEraseData}
        >
          {t("data.eraseBtn")}
        </button>

        {/* ---------- Güvenlik ---------- */}
        <h3 className="section-title">{t("security.title")}</h3>

        {!draftPrefs.lockEnabled ? (
          <>
            <p className="field-hint">{t("security.offHint")}</p>
            <p className="field-hint strong-hint"><span aria-hidden="true">🔓</span> {t("security.enableTitle")}</p>
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
            {pinError && (
              <p className="form-error" role="alert">
                {pinError}
              </p>
            )}
            <div className="form-actions">
              <button className="btn btn-primary" disabled={busy} onClick={() => void handleEnable()}>
                <span aria-hidden="true">🔒</span> {t("security.enableTitle")}
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
            {pinError && (
              <p className="form-error" role="alert">
                {pinError}
              </p>
            )}
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
                disabled={busy}
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

