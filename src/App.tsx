import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CategoryId, Language, Payment, Prefs, VaultData } from "./types";
import {
  DEFAULT_PREFS,
  DEFAULT_VAULT,
  changePin,
  disableLock,
  enableLock,
  isVaultLocked,
  loadLastSync,
  loadPrefs,
  loadUnlockedVault,
  sanitize,
  saveLastSync,
  saveLockedVault,
  savePrefs,
  saveUnlockedVault,
  unlockVault,
  wipeAllData,
} from "./lib/storage";
import {
  checkUpcomingPayments,
  clearNotifiedToday,
  requestNotificationPermission,
} from "./lib/notify";
import { buildDemoPayments } from "./lib/demo";
import { exportCsv, parseCsv } from "./lib/csv";
import { advanceCycle, nextOccurrence, todayISO, toTryPerMonth } from "./lib/format";
import {
  cloudEnabled,
  getCloudUser,
  onAuthChange,
  pullVaultData,
  pushVaultData,
  signInEmail,
  signInGoogle,
  signInPhone,
  signOutCloud,
  signUpEmail,
  signUpPhone,
  verifyPhoneOtp,
  type CloudUser,
} from "./lib/cloud";
import { getGuideOrGeneric, normalizeName } from "./data/guides";
import { I18nProvider, useI18n } from "./i18n";
import { makeT } from "./i18n/t";
import Header from "./components/Header";
import SummaryCards from "./components/SummaryCards";
import Toolbar, { type SortKey } from "./components/Toolbar";
import PaymentCard from "./components/PaymentCard";
import PaymentFormModal from "./components/PaymentFormModal";
import GuideModal from "./components/GuideModal";
import PriceChartModal from "./components/PriceChartModal";
import SettingsModal from "./components/SettingsModal";
import LockScreen from "./components/LockScreen";
import ConfirmModal from "./components/ConfirmModal";
import AuthModal from "./components/AuthModal";
import AccountProfileModal from "./components/AccountProfileModal";

const REPO_URL = "https://github.com/Voyagerroc/payradar";

export type SyncState = "idle" | "syncing" | "success" | "error";

type EditorState = Payment | "new" | null;
type Mode = "loading" | "locked" | "ready";

interface BootState {
  prefs: Prefs;
  vault: VaultData;
  mode: Mode;
}

/** localStorage'dan bir kez okunur; kilitliyken vault verisi belleğe alınmaz. */
function readBoot(): BootState {
  const prefs = loadPrefs();
  if (prefs.lockEnabled && isVaultLocked()) {
    return { prefs, vault: DEFAULT_VAULT, mode: "locked" };
  }
  return { prefs, vault: loadUnlockedVault(), mode: "ready" };
}

export default function App() {
  const [boot] = useState(readBoot);
  const [mode, setMode] = useState<Mode>(boot.mode);
  const [prefs, setPrefs] = useState<Prefs>(boot.prefs);
  const [vault, setVault] = useState<VaultData>(boot.vault);
  const sessionKeyRef = useRef<CryptoKey | null>(null);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [sort, setSort] = useState<SortKey>("date");
  const [editor, setEditor] = useState<EditorState>(null);
  const [guideFor, setGuideFor] = useState<Payment | null>(null);
  const [chartFor, setChartFor] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [cloudUser, setCloudUser] = useState<CloudUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [lastSyncTime, setLastSyncTime] = useState<number>(loadLastSync);
  const lastPushedAtRef = useRef(0);
  // Güncel state'e updater dışında erişim için (pullAndMerge yan etkisiz kalsın)
  const vaultRef = useRef(vault);
  const prefsRef = useRef(prefs);
  useEffect(() => {
    vaultRef.current = vault;
  }, [vault]);
  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);
  // Buluttan uygulanan pref değişikliği geri-push tetiklemesin
  const prefsFromCloudRef = useRef(false);
  const syncResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = useMemo(() => makeT(prefs.language), [prefs.language]);

  /** Buluta yazarken senkron durumunu ve son eşitleme zamanını da günceller. */
  const syncedPush = useCallback(
    async (data: VaultData, theme: Prefs["theme"], language: Language) => {
      setSyncState("syncing");
      const ok = await pushVaultData({ ...data, appTheme: theme, appLanguage: language });
      if (ok) {
        const now = Date.now();
        setLastSyncTime(now);
        saveLastSync(now);
        setSyncState("success");
        if (syncResetTimerRef.current) clearTimeout(syncResetTimerRef.current);
        syncResetTimerRef.current = setTimeout(() => setSyncState("idle"), 1200);
      } else {
        setSyncState("error");
      }
      return ok;
    },
    [],
  );

  useEffect(
    () => () => {
      if (syncResetTimerRef.current) clearTimeout(syncResetTimerRef.current);
    },
    [],
  );

  /* ---------- Bulut oturumu ---------- */
  useEffect(() => {
    if (!cloudEnabled || mode !== "ready") return;
    let cancelled = false;
    void (async () => {
      const user = await getCloudUser();
      if (cancelled || !user) return;
      setCloudUser(user);
      await pullAndMerge();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudEnabled, mode]);

  /** Giriş sonrası: uzak daha yeniyse indir, değilse yereli yükle.
   *  Yan etkiler updater DIŞINDA — StrictMode/concurrent render çifte push yapmasın. */
  async function pullAndMerge() {
    const remote = await pullVaultData();
    if (!remote) return;
    const remoteData = asVaultData(remote.data, remote.updatedAt);
    const current = vaultRef.current;

    if (!remoteData || (remoteData.updatedAt ?? 0) <= (current.updatedAt ?? 0)) {
      // Yerel daha güncel -> buluta yaz
      lastPushedAtRef.current = Date.now();
      void syncedPush(current, prefsRef.current.theme, prefsRef.current.language);
      return;
    }

    lastPushedAtRef.current = Date.now();
    setToast(t("toast.cloudPulled"));
    // Tema/dil buluttan geliyorsa cihazlar arası taşı (geri-push tetiklemeden)
    if (remoteData.appTheme || remoteData.appLanguage) {
      prefsFromCloudRef.current = true;
      setPrefs((p) => ({
        ...p,
        theme: remoteData.appTheme ?? p.theme,
        language: remoteData.appLanguage ?? p.language,
      }));
    }
    // appTheme/appLanguage prefs'e uygulandı; vault state'inde bayat kopya tutma
    const { appTheme: _theme, appLanguage: _lang, ...vaultOnly } = remoteData;
    setVault((v) => ({ ...v, ...vaultOnly }));
  }

  /* ---------- Dış oturum değişikliği (Google OAuth dönüşü, başka sekme) ---------- */
  useEffect(() => {
    if (!cloudEnabled || mode !== "ready") return;
    return onAuthChange(() => {
      void (async () => {
        const user = await getCloudUser();
        if (!user) return;
        setCloudUser(user);
        await pullAndMerge();
      })();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* ---------- Buluta otomatik kaydetme (1.5 sn debounced) ---------- */
  useEffect(() => {
    if (mode !== "ready" || !cloudUser) return;
    if (vault.updatedAt <= lastPushedAtRef.current) return;
    const timer = setTimeout(() => {
      lastPushedAtRef.current = Date.now();
      void syncedPush(vault, prefsRef.current.theme, prefsRef.current.language);
    }, 1500);
    return () => clearTimeout(timer);
  }, [vault, cloudUser, mode, syncedPush]);

  /* ---------- Tema/dil değişince de buluta yaz (vault'a dokunulmasa bile) ---------- */
  const prefsSyncMountedRef = useRef(false);
  useEffect(() => {
    if (!prefsSyncMountedRef.current) {
      prefsSyncMountedRef.current = true;
      return;
    }
    if (prefsFromCloudRef.current) {
      prefsFromCloudRef.current = false;
      return;
    }
    if (mode !== "ready" || !cloudUser) return;
    // Vault'u "kirli" işaretle; debounced push güncel tema/dili de taşır
    setVault((v) => ({ ...v, updatedAt: Date.now() }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.theme, prefs.language]);

  /* ---------- Kalıcılık ---------- */
  useEffect(() => {
    if (mode !== "ready") return;
    if (prefs.lockEnabled && sessionKeyRef.current) {
      void saveLockedVault(sessionKeyRef.current, vault);
    } else {
      saveUnlockedVault(vault);
    }
  }, [vault, prefs.lockEnabled, mode]);

  useEffect(() => {
    savePrefs(prefs);
    document.documentElement.dataset.theme =
      prefs.theme === "auto" ? "" : prefs.theme;
    document.documentElement.lang = prefs.language;
  }, [prefs]);

  /* ---------- Bildirimler ---------- */
  useEffect(() => {
    if (mode !== "ready" || !vault.notificationsEnabled) return;
    const opts = { lang: prefs.language, usdTry: vault.usdTry, eurTry: vault.eurTry };
    checkUpcomingPayments(vault.payments, vault.reminderDays, opts);
    // Uygulama uzun süre açık kalırsa (kurulu PWA/TWA) bir ödeme hatırlatma
    // aralığına saatler sonra girebilir; periyodik olarak yeniden kontrol et.
    const interval = setInterval(
      () => checkUpcomingPayments(vault.payments, vault.reminderDays, opts),
      30 * 60_000,
    );
    return () => clearInterval(interval);
  }, [
    vault.payments,
    vault.notificationsEnabled,
    vault.reminderDays,
    vault.usdTry,
    vault.eurTry,
    prefs.language,
    mode,
  ]);

  /* ---------- Toast ---------- */
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  /* ---------- Otomatik kilit ---------- */
  const lockNow = useCallback(() => {
    if (!prefs.lockEnabled) return;
    sessionKeyRef.current = null;
    setEditor(null);
    setGuideFor(null);
    setSettingsOpen(false);
    setToast("");
    setMode("locked");
  }, [prefs.lockEnabled]);

  useEffect(() => {
    if (mode !== "ready" || !prefs.lockEnabled || prefs.autoLockMinutes === 0) return;

    let lastActivity = Date.now();
    const bump = () => {
      lastActivity = Date.now();
    };
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, bump, { passive: true }));

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > prefs.autoLockMinutes * 60_000) lockNow();
    }, 15_000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, bump));
      clearInterval(interval);
    };
  }, [mode, prefs.lockEnabled, prefs.autoLockMinutes, lockNow]);

  /* ---------- Kilit işlemleri ---------- */
  async function handleUnlock(pin: string): Promise<boolean> {
    const opened = await unlockVault(pin);
    if (!opened) return false;
    sessionKeyRef.current = opened.key;
    setVault(opened.data);
    setMode("ready");
    return true;
  }

  function handleLock() {
    lockNow();
  }

  async function handleEnableLock(pin: string): Promise<boolean> {
    await enableLock(vault, pin);
    const opened = await unlockVault(pin);
    if (opened) sessionKeyRef.current = opened.key;
    setPrefs((p) => ({ ...p, lockEnabled: true }));
    setToast(t("toast.lockEnabled"));
    return true;
  }

  async function handleChangePin(oldPin: string, newPin: string): Promise<boolean> {
    const ok = await changePin(oldPin, newPin);
    if (ok) {
      const opened = await unlockVault(newPin);
      if (opened) sessionKeyRef.current = opened.key;
      setToast(t("toast.pinChanged"));
    }
    return ok;
  }

  async function handleDisableLock(pin: string): Promise<boolean> {
    const data = await disableLock(pin);
    if (!data) return false;
    sessionKeyRef.current = null;
    setVault(data);
    setPrefs((p) => ({ ...p, lockEnabled: false }));
    setToast(t("toast.lockDisabled"));
    return true;
  }

  function handleWipe() {
    wipeAllData();
    sessionKeyRef.current = null;
    setPrefs({ ...DEFAULT_PREFS });
    const wiped: VaultData = { ...DEFAULT_VAULT, payments: [], updatedAt: Date.now() };
    setVault(wiped);
    setMode("ready");
    // Bulutta hâlâ eski veri kalmasın; oturum açıksa boş vault'u hemen üzerine yaz.
    if (cloudUser) {
      lastPushedAtRef.current = Date.now();
      void syncedPush(wiped, DEFAULT_PREFS.theme, DEFAULT_PREFS.language);
    }
  }

  /* ---------- Ödeme işlemleri ---------- */
  function touchVault(updater: (v: VaultData) => VaultData) {
    setVault((v) => ({ ...updater(v), updatedAt: Date.now() }));
  }

  function handleSave(payment: Payment) {
    touchVault((v) => {
      const index = v.payments.findIndex((x) => x.id === payment.id);
      const payments =
        index === -1
          ? [...v.payments, payment]
          : v.payments.map((x, i) =>
              i === index ? withPriceHistory(v.payments[i], payment) : x,
            );
      return { ...v, payments };
    });
    setEditor(null);
    setToast(t("toast.saved"));
  }

  function handleDelete(id: string) {
    const payment = vault.payments.find((p) => p.id === id);
    if (!payment) return;
    setDeleteTarget(payment);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    touchVault((v) => ({ ...v, payments: v.payments.filter((p) => p.id !== id) }));
    setDeleteTarget(null);
    setToast(t("toast.deleted"));
  }

  /** Fiyat/para birimi değiştiyse eski fiyatı geçmişe işler. */
  function withPriceHistory(prev: Payment, next: Payment): Payment {
    if (prev.price === next.price && prev.currency === next.currency) {
      return next.priceHistory ? next : { ...next, priceHistory: prev.priceHistory };
    }
    return {
      ...next,
      priceHistory: [
        ...(prev.priceHistory ?? []),
        { date: todayISO(), price: prev.price },
      ],
    };
  }

  async function handleImportCsv(file: File) {
    const text = await file.text();
    const { payments, skipped } = parseCsv(text);
    let added = 0;

    touchVault((v) => {
      // normalizeName: tr küçük harf + ı→i katlama — "NETFLIX" ile "Netflix" aynı kayıt
      const dupeKey = (p: Payment) =>
        `${normalizeName(p.name)}|${p.nextPaymentDate}|${p.price}`;
      const existing = new Set(v.payments.map(dupeKey));
      const fresh = payments.filter((p) => {
        const key = dupeKey(p);
        if (existing.has(key)) return false;
        existing.add(key);
        added++;
        return true;
      });
      return { ...v, payments: [...v.payments, ...fresh] };
    });

    setToast(t("toast.importDone", { added, skipped }));
  }

  function handleExportCsv() {
    exportCsv(vault.payments);
  }

  /* ---------- Bulut hesap işlemleri ---------- */
  async function handleCloudSignIn(email: string, password: string): Promise<string | null> {
    const result = await signInEmail(email, password);
    if (!result.ok) return result.error ?? "error";
    const user = await getCloudUser();
    setCloudUser(user);
    await pullAndMerge();
    setToast(t("toast.signedIn", { email }));
    return null;
  }

  async function handleCloudSignUp(
    email: string,
    password: string,
    name: string,
  ): Promise<{ error: string | null; needsConfirm: boolean }> {
    const result = await signUpEmail(email, password, name);
    if (!result.ok) return { error: result.error ?? "error", needsConfirm: false };
    if (result.needsConfirm) return { error: null, needsConfirm: true };
    const user = await getCloudUser();
    setCloudUser(user);
    lastPushedAtRef.current = Date.now();
    await syncedPush(vault, prefs.theme, prefs.language);
    setToast(t("toast.signedUp"));
    return { error: null, needsConfirm: false };
  }

  async function handleCloudSignInPhone(phone: string, password: string): Promise<string | null> {
    const result = await signInPhone(phone, password);
    if (!result.ok) return result.error ?? "error";
    const user = await getCloudUser();
    setCloudUser(user);
    await pullAndMerge();
    setToast(t("toast.signedIn", { email: phone }));
    return null;
  }

  async function handleCloudSignUpPhone(
    phone: string,
    password: string,
  ): Promise<{ error: string | null; needsOtp: boolean }> {
    const result = await signUpPhone(phone, password);
    if (!result.ok) return { error: result.error ?? "error", needsOtp: false };
    if (result.needsConfirm) return { error: null, needsOtp: true };
    const user = await getCloudUser();
    setCloudUser(user);
    lastPushedAtRef.current = Date.now();
    await syncedPush(vault, prefs.theme, prefs.language);
    setToast(t("toast.signedUp"));
    return { error: null, needsOtp: false };
  }

  async function handleCloudVerifyPhoneOtp(phone: string, token: string): Promise<string | null> {
    const result = await verifyPhoneOtp(phone, token);
    if (!result.ok) return result.error ?? "error";
    const user = await getCloudUser();
    setCloudUser(user);
    lastPushedAtRef.current = Date.now();
    await syncedPush(vault, prefs.theme, prefs.language);
    setToast(t("toast.signedUp"));
    return null;
  }

  async function handleCloudGoogle(): Promise<string | null> {
    const result = await signInGoogle();
    // Başarıda sayfa Google'a yönlenir; dönüşte oturum efekti devralır
    return result.ok ? null : (result.error ?? "error");
  }

  async function handleCloudSignOut(): Promise<void> {
    await signOutCloud();
    setCloudUser(null);
    setProfileOpen(false);
    lastPushedAtRef.current = 0;
    setToast(t("toast.signedOut"));
  }

  async function handleSyncNow(): Promise<void> {
    if (!cloudUser) return;
    lastPushedAtRef.current = Date.now();
    const ok = await syncedPush(vault, prefs.theme, prefs.language);
    if (ok) setToast(t("toast.syncSuccess"));
  }

  /** Ödendi/İleri Sar: vadeyi en az bir tam dönem ileri taşır; kredi taksit sayacını artırır. */
  function handleAdvance(id: string) {
    touchVault((v) => ({
      ...v,
      payments: v.payments.map((p) => {
        if (p.id !== id) return p;
        const bumpedInstallment =
          p.categoryId === "kredi" && p.currentInstallment != null
            ? Math.min(
                p.currentInstallment + 1,
                p.totalInstallments ?? p.currentInstallment + 1,
              )
            : p.currentInstallment;
        return {
          ...p,
          nextPaymentDate: advanceCycle(p.nextPaymentDate, p.billingCycle),
          isTrial: false,
          currentInstallment: bumpedInstallment,
        };
      }),
    }));
    setToast(t("toast.saved"));
  }

  function handleTestNotifications() {
    // Bugünün "gönderildi" kaydını temizle ki test bildirimi gerçekten görünsün
    clearNotifiedToday();
    checkUpcomingPayments(vault.payments, vault.reminderDays, {
      lang: prefs.language,
      usdTry: vault.usdTry,
      eurTry: vault.eurTry,
    });
  }

  function handleDemo() {
    touchVault((v) => ({ ...v, payments: buildDemoPayments() }));
    setToast(t("toast.demoLoaded"));
  }

  function handleEnableNotifications() {
    void requestNotificationPermission().then((granted) => {
      if (granted) {
        setVault((v) => ({ ...v, notificationsEnabled: true }));
        checkUpcomingPayments(vault.payments, vault.reminderDays, {
          lang: prefs.language,
          usdTry: vault.usdTry,
          eurTry: vault.eurTry,
        });
        setToast(t("toast.notifEnabled"));
      } else {
        setToast(t("toast.notifDenied"));
      }
    });
  }

  function setLang(lang: Language) {
    setPrefs((p) => ({ ...p, language: lang }));
  }

  const visiblePayments = useMemo(
    () =>
      mode === "ready"
        ? filterAndSort(vault.payments, query, category, sort, vault)
        : [],
    [vault, mode, query, category, sort],
  );

  if (mode === "loading") return <div className="app" />;

  return (
    <I18nProvider lang={prefs.language} onChange={setLang}>
      {mode === "locked" ? (
        <LockScreen onUnlock={handleUnlock} onWipe={handleWipe} />
      ) : (
        <div className="app">
          <Header
            onOpenSettings={() => setSettingsOpen(true)}
            onLock={prefs.lockEnabled ? handleLock : undefined}
            cloudEnabled={cloudEnabled}
            cloudUser={cloudUser}
            onOpenAccount={() => (cloudUser ? setProfileOpen(true) : setAuthOpen(true))}
          />

          <main className="container">
            {cloudEnabled && !cloudUser && (
              <button className="cloud-banner" onClick={() => setAuthOpen(true)}>
                <span>{t("auth.banner.text")}</span>
                <span className="btn btn-primary">{t("auth.banner.btn")}</span>
              </button>
            )}

            <SummaryCards payments={vault.payments} vault={vault} />

            {vault.payments.length === 0 ? (
              <EmptyState onAdd={() => setEditor("new")} onDemo={handleDemo} />
            ) : (
              <>
                <Toolbar
                  query={query}
                  onQueryChange={setQuery}
                  category={category}
                  onCategoryChange={setCategory}
                  sort={sort}
                  onSortChange={setSort}
                  onAdd={() => setEditor("new")}
                />

                {visiblePayments.length === 0 ? (
                  <NoResults />
                ) : (
                  <div className="grid">
                    {visiblePayments.map((payment) => (
                      <PaymentCard
                        key={payment.id}
                        payment={payment}
                      onEdit={() => setEditor(payment)}
                      onDelete={() => handleDelete(payment.id)}
                      onShowGuide={() => setGuideFor(payment)}
                      onShowHistory={
                        payment.priceHistory?.length
                          ? () => setChartFor(payment)
                          : undefined
                      }
                      onAdvance={() => handleAdvance(payment.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </main>

          {editor && (
            <PaymentFormModal
              key={editor === "new" ? "new" : editor.id}
              initial={editor === "new" ? null : editor}
              onClose={() => setEditor(null)}
              onSave={handleSave}
            />
          )}

          {guideFor && (
            <GuideModal
              guide={getGuideOrGeneric(guideFor.name, prefs.language)}
              serviceName={guideFor.name}
              onClose={() => setGuideFor(null)}
            />
          )}

          {chartFor && (
            <PriceChartModal payment={chartFor} onClose={() => setChartFor(null)} />
          )}

          {deleteTarget && (
            <ConfirmModal
              message={t("confirm.deletePayment", { name: deleteTarget.name })}
              onCancel={() => setDeleteTarget(null)}
              onConfirm={confirmDelete}
            />
          )}

          {settingsOpen && (
            <SettingsModal
              prefs={prefs}
              vault={vault}
              onClose={() => setSettingsOpen(false)}
              onSavePrefs={(p) => {
                setPrefs(p);
                setSettingsOpen(false);
                setToast(t("toast.settingsSaved"));
              }}
              onSaveVault={(v) => setVault({ ...v, updatedAt: Date.now() })}
              onEnableLock={handleEnableLock}
              onChangePin={handleChangePin}
              onDisableLock={handleDisableLock}
              onExportCsv={handleExportCsv}
              onImportCsv={(file) => void handleImportCsv(file)}
              cloudEnabled={cloudEnabled}
              cloudUser={cloudUser}
              onOpenAuth={() => {
                setSettingsOpen(false);
                setAuthOpen(true);
              }}
              onOpenProfile={() => {
                setSettingsOpen(false);
                setProfileOpen(true);
              }}
              onTestNotifications={handleTestNotifications}
              onLoadDemo={handleDemo}
            />
          )}

          {authOpen && (
            <AuthModal
              onClose={() => setAuthOpen(false)}
              onSignIn={handleCloudSignIn}
              onSignUp={handleCloudSignUp}
              onSignInPhone={handleCloudSignInPhone}
              onSignUpPhone={handleCloudSignUpPhone}
              onVerifyPhoneOtp={handleCloudVerifyPhoneOtp}
              onGoogle={handleCloudGoogle}
            />
          )}

          {profileOpen && cloudUser && (
            <AccountProfileModal
              user={cloudUser}
              syncState={syncState}
              lastSyncTime={lastSyncTime}
              onSyncNow={() => void handleSyncNow()}
              onSignOut={() => void handleCloudSignOut()}
              onSwitchAccount={() => {
                void handleCloudSignOut().then(() => setAuthOpen(true));
              }}
              onClose={() => setProfileOpen(false)}
            />
          )}

          {vault.payments.length > 0 &&
            !vault.notificationsEnabled &&
            !bannerDismissed && (
              <NotificationBanner
                onEnable={handleEnableNotifications}
                onDismiss={() => setBannerDismissed(true)}
              />
            )}

          {toast && <div className="toast">{toast}</div>}

          <Footer />
        </div>
      )}
    </I18nProvider>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <p>{t("footer.free")}</p>
      <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
        {t("footer.openSource")} · github.com/Voyagerroc/payradar
      </a>
    </footer>
  );
}

/* ---------- Küçük yardımcı bileşenler ---------- */

function EmptyState({ onAdd, onDemo }: { onAdd: () => void; onDemo: () => void }) {
  const { t } = useI18n();
  return (
    <section className="card empty-state">
      <h2>{t("empty.title")}</h2>
      <p>{t("empty.body")}</p>
      <div className="empty-actions">
        <button className="btn btn-primary" onClick={onAdd}>
          {t("empty.addFirst")}
        </button>
        <button className="btn btn-secondary" onClick={onDemo}>
          {t("empty.tryDemo")}
        </button>
      </div>
    </section>
  );
}

function NoResults() {
  const { t } = useI18n();
  return <p className="no-results">{t("list.noResults")}</p>;
}

function NotificationBanner({
  onEnable,
  onDismiss,
}: {
  onEnable: () => void;
  onDismiss: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="notif-banner">
      <span>{t("banner.notif")}</span>
      <div className="notif-banner-actions">
        <button className="btn btn-primary" onClick={onEnable}>
          {t("banner.open")}
        </button>
        <button
          className="icon-btn"
          onClick={onDismiss}
          aria-label="✕"
          title="✕"
        >
          ✕
        </button>
      </div>
    </div>
  );
}


/** Buluttan gelen ham veriyi VaultData'ya çevirir; bozuksa null döner. */
function asVaultData(raw: unknown, fallbackUpdatedAt: number): VaultData | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.payments)) return null;
  const theme = r.appTheme;
  const language = r.appLanguage;
  // sanitize: geçersiz ödeme kayıtlarını eler, kategori-dışı alanları temizler
  return sanitize({
    payments: r.payments as Payment[],
    reminderDays: Number(r.reminderDays ?? 3),
    notificationsEnabled: Boolean(r.notificationsEnabled ?? false),
    usdTry: Number(r.usdTry ?? 42),
    eurTry: Number(r.eurTry ?? 48),
    updatedAt: Number(r.updatedAt ?? fallbackUpdatedAt),
    appTheme:
      theme === "auto" || theme === "light" || theme === "dark" ? theme : undefined,
    appLanguage:
      language === "tr" || language === "en" || language === "ms" ? language : undefined,
  });
}

function filterAndSort(
  payments: Payment[],
  query: string,
  category: CategoryId | "all",
  sort: SortKey,
  vault: VaultData,
): Payment[] {
  // normalizeName ı→i katlar; "IPTV" araması Türkçe küçük harf tuzağına düşmez
  const q = normalizeName(query);
  let result = payments;

  if (category !== "all") result = result.filter((p) => p.categoryId === category);
  if (q)
    result = result.filter(
      (p) =>
        normalizeName(p.name).includes(q) ||
        normalizeName(p.notes ?? "").includes(q),
    );

  const sorted = [...result];
  switch (sort) {
    case "date":
      sorted.sort((a, b) =>
        nextOccurrence(a.nextPaymentDate, a.billingCycle).localeCompare(
          nextOccurrence(b.nextPaymentDate, b.billingCycle),
        ),
      );
      break;
    case "price-desc":
      sorted.sort(
        (a, b) =>
          toTryPerMonth(b, vault.usdTry, vault.eurTry) -
          toTryPerMonth(a, vault.usdTry, vault.eurTry),
      );
      break;
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "tr"));
      break;
  }
  return sorted;
}

