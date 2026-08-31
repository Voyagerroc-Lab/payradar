import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { requestNotificationPermission } from "../lib/notify";
import { formatMoney, localeFor } from "../lib/format";
import { CURRENCIES, convert, currencyLabel, type FxTable } from "../lib/fx";
import type { Language, Prefs, ThemeId, VaultData } from "../types";
import type { CloudUser } from "../lib/cloud";
import { applyTheme } from "../lib/theme";
import { useI18n } from "../i18n";
import { Icon } from "./icons";

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

const BASE_THEMES = ["auto", "light", "dark", "paper"] as const;

/* Kulüp adları çevrilmez; renkler kulübün forma renkleridir ve düğmenin
   üstündeki iki bantta aynen görünür — tema seçilmeden önce ne olduğu
   okunmadan anlaşılır. */
const TEAM_THEMES: { id: ThemeId; name: string; colors: [string, string] }[] = [
  { id: "gs", name: "Galatasaray", colors: ["#A90432", "#FDB913"] },
  { id: "fb", name: "Fenerbahçe", colors: ["#1B458F", "#FFED00"] },
  { id: "bjk", name: "Beşiktaş", colors: ["#0B0B0C", "#FFFFFF"] },
  { id: "ts", name: "Trabzonspor", colors: ["#8A1538", "#4FA8E8"] },
];

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
  // Kur kutusu seçili GÖSTERİM birimine göre önizlenir (dilden bağımsız)
  const fxHome = draftPrefs.displayCurrency;
  /* Kutuda tüm dünya listelenmez; başlıca birimlerin seçili birime karşılığı
     yeterli fikir verir. */
  const FX_PREVIEW: string[] = ["USD", "EUR", "TRY", "GBP", "MYR", "AED"];

  // PIN form durumları
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [busy, setBusy] = useState(false);

  /* Tema anında önizlenir: kulüp seçildiğinde uygulamanın kendisi değişir.
     Kaydetmeden çıkılırsa (İptal, ✕, Esc) kayıtlı tema geri gelir; kaydedilirse
     App'in kendi tema etkisi devralır. */
  useEffect(() => {
    applyTheme(draftPrefs.theme);
  }, [draftPrefs.theme]);

  useEffect(
    () => () => {
      applyTheme(prefs.theme);
    },
    [prefs.theme],
  );

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
            <option value="es">Español</option>
            <option value="ar">العربية</option>
          </select>
        </label>

        <label className="field">
          <span>{t("form.currency")}</span>
          <select
            className="input"
            value={draftPrefs.displayCurrency}
            onChange={(e) =>
              setDraftPrefs({ ...draftPrefs, displayCurrency: e.target.value })
            }
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencyLabel(code, localeFor(draftPrefs.language))}
              </option>
            ))}
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
                {FX_PREVIEW.filter((c) => c !== fxHome).map((c) => (
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

        <div className="field">
          <span>{t("settings.theme")}</span>
          <div className="chips" role="group" aria-label={t("settings.theme")}>
            {BASE_THEMES.map((id) => (
              <button
                key={id}
                type="button"
                className={`chip-btn ${draftPrefs.theme === id ? "active" : ""}`}
                aria-pressed={draftPrefs.theme === id}
                onClick={() => setDraftPrefs({ ...draftPrefs, theme: id })}
              >
                {t(`theme.${id}`)}
              </button>
            ))}
          </div>

          <span className="theme-group-label">{t("theme.groupTeams")}</span>
          <div className="team-grid" role="group" aria-label={t("theme.groupTeams")}>
            {TEAM_THEMES.map((team) => (
              <button
                key={team.id}
                type="button"
                className={`team-tile ${draftPrefs.theme === team.id ? "active" : ""}`}
                aria-pressed={draftPrefs.theme === team.id}
                onClick={() => setDraftPrefs({ ...draftPrefs, theme: team.id })}
              >
                <span className="team-swatch" aria-hidden="true">
                  <i style={{ background: team.colors[0] }} />
                  <i style={{ background: team.colors[1] }} />
                </span>
                <span className="team-name" translate="no">
                  {team.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ---------- Hesap ---------- */}
        <h3 className="section-title">{t("auth.profile.title")}</h3>
        {cloudEnabled && draftPrefs.lockEnabled && (
          <p className="field-hint strong-hint"><Icon name="warn" size={13} /> {t("account.cloudNotEncryptedHint")}</p>
        )}
        {!cloudEnabled ? (
          <p className="field-hint">{t("account.disabledHint")}</p>
        ) : cloudUser ? (
          <div className="settings-account-card">
            <span>
              <Icon name="cloud" size={14} />{" "}
              {t("account.signedInAs", { identity: cloudUser.email ?? "" })}
            </span>
            <button className="btn btn-secondary" onClick={onOpenProfile}>
              {t("auth.profile.title")}
            </button>
          </div>
        ) : (
          <div className="settings-account-card">
            <span>{t("auth.signInSubtitle")}</span>
            <button className="btn btn-primary" onClick={onOpenAuth}>
              {t("auth.signIn")}
            </button>
          </div>
        )}

        {/* ---------- Veri Yedekleme ---------- */}
        <h3 className="section-title">{t("data.title")}</h3>
        <p className="field-hint">{t("data.importHint")}</p>
        <div className="form-row">
          <button className="btn btn-secondary" onClick={onExportCsv}>
            <Icon name="download" size={14} /> {t("data.exportBtn")}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon name="upload" size={14} /> {t("data.importBtn")}
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
          <Icon name="sparkle" size={13} /> {t("empty.tryDemo")}
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
            <p className="field-hint strong-hint"><Icon name="unlock" size={13} /> {t("security.enableTitle")}</p>
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
                <Icon name="lock" size={13} /> {t("security.enableTitle")}
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

