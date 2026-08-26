import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CategoryId, Currency, Language, Payment, Prefs, VaultData } from "./types";
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
  loadVaultOwner,
  sanitize,
  saveLastSync,
  saveVaultOwner,
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
import { buildDemoPayments, relocalizeDemoPayments } from "./lib/demo";
import { exportCsv, parseCsv } from "./lib/csv";
import { advanceCycle, nextOccurrence, todayISO, toMonthlyIn } from "./lib/format";
import { ensureFx, loadFx, type FxTable } from "./lib/fx";
import {
  cloudEnabled,
  deleteCloudAccount,
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
import {
  getSubscription,
  isEntitled,
  premiumGateEnabled,
  type Subscription,
} from "./lib/premium";
import { clearSyncKey, getRecoveryKey, importRecoveryKey } from "./lib/syncCrypto";
import { useTilt } from "./lib/tilt";
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
import SyncKeyModal from "./components/SyncKeyModal";

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
  /* Canlı kurlar: açılışta son bilinen tablo, arkada güncel veri denenir.
     Tablo USD tabanlı ve dilden bağımsızdır; ana para birimi dilden türetilir. */
  const [fx, setFx] = useState<FxTable | null>(() => loadFx());
  const sessionKeyRef = useRef<CryptoKey | null>(null);

  // Ödeme ızgarası: işaretçi takipli 3B eğim (tek dinleyici, olay delegasyonu)
  const gridRef = useTilt<HTMLDivElement>(".sub-card");

  // Dil değişince demo kayıtları da yeni dile döner. relocalize yalnızca
  // dokunulmamış demo alanlarını çevirir; kullanıcının düzenlediği bir ad
  // asla ezilmez ve değişiklik yoksa kasa "değişti" diye işaretlenmez.
  useEffect(() => {
    setVault((v) => {
      const payments = relocalizeDemoPayments(v.payments, prefs.language);
      return payments === v.payments ? v : { ...v, payments, updatedAt: Date.now() };
    });
  }, [prefs.language]);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [sort, setSort] = useState<SortKey>("date");
  const [editor, setEditor] = useState<EditorState>(null);
  const [guideFor, setGuideFor] = useState<Payment | null>(null);
  const [chartFor, setChartFor] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [demoConfirmOpen, setDemoConfirmOpen] = useState(false);
  const [eraseConfirmOpen, setEraseConfirmOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [needsSyncKey, setNeedsSyncKey] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  /* Giriş şeridi kapatılınca bir daha çıkmaz (giriş her zaman başlıktan ve
     Ayarlar'dan erişilebilir kalır); tercih cihazda kalıcıdır. */
  const [cloudBannerDismissed, setCloudBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem("payradar:cloudBannerDismissed:v1") === "1";
    } catch {
      return false;
    }
  });

  function dismissCloudBanner() {
    setCloudBannerDismissed(true);
    try {
      localStorage.setItem("payradar:cloudBannerDismissed:v1", "1");
    } catch {
      /* depolama kapalıysa yalnızca bu oturumda gizli kalır */
    }
  }
  const [cloudUser, setCloudUser] = useState<CloudUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [lastSyncTime, setLastSyncTime] = useState<number>(loadLastSync);
  const [subscription, setSubscription] = useState<Subscription>({
    status: "none",
    currentPeriodEnd: null,
  });
  const entitled = isEntitled(subscription);
  const entitledRef = useRef(entitled);
  useEffect(() => {
    entitledRef.current = entitled;
  }, [entitled]);
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
      await pullAndMerge(user.uid);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudEnabled, mode]);

  /** Giriş sonrası: uzak daha yeniyse indir, değilse yereli yükle.
   *  Yan etkiler updater DIŞINDA — StrictMode/concurrent render çifte push yapmasın. */
  async function pullAndMerge(uid?: string) {
    // Abonelik durumunu tazele; premium kapısı aktifken yetkisiz hesaplar senkron yapmaz
    const sub = await getSubscription();
    setSubscription(sub);
    if (premiumGateEnabled && !isEntitled(sub)) return;

    const remote = await pullVaultData();
    if (!remote) {
      // Bu hesapta bulut kaydı yok: yerel veri BAŞKA hesaba aitse yükleme
      const owner = loadVaultOwner();
      if (uid && owner && owner !== uid) {
        setVault({ ...DEFAULT_VAULT, updatedAt: 0 });
        saveVaultOwner(uid);
      } else if (uid) {
        saveVaultOwner(uid);
      }
      return;
    }

    // Bu cihazda şifre çözme anahtarı yok — buluttaki veriyi ezme, kullanıcıdan iste
    if (remote.needsKey) {
      setNeedsSyncKey(true);
      return;
    }

    const remoteData = asVaultData(remote.data, remote.updatedAt);
    const current = vaultRef.current;
    const owner = loadVaultOwner();
    // Yereldeki veri farklı bir hesaba aitse ASLA yukarı gönderme (hesap değiştirme koruması)
    const foreignLocal = Boolean(uid && owner && owner !== uid);

    if (!foreignLocal && (!remoteData || (remoteData.updatedAt ?? 0) <= (current.updatedAt ?? 0))) {
      // Yerel daha güncel -> buluta yaz
      lastPushedAtRef.current = Date.now();
      if (uid) saveVaultOwner(uid);
      void syncedPush(current, prefsRef.current.theme, prefsRef.current.language);
      return;
    }
    if (!remoteData) return;
    if (uid) saveVaultOwner(uid);

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
        await pullAndMerge(user.uid);
      })();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* ---------- Buluta otomatik kaydetme (1.5 sn debounced) ---------- */
  useEffect(() => {
    if (mode !== "ready" || !cloudUser) return;
    if (premiumGateEnabled && !entitled) return;
    if (vault.updatedAt <= lastPushedAtRef.current) return;
    const timer = setTimeout(() => {
      lastPushedAtRef.current = Date.now();
      void syncedPush(vault, prefsRef.current.theme, prefsRef.current.language);
    }, 1500);
    return () => clearTimeout(timer);
  }, [vault, cloudUser, mode, entitled, syncedPush]);

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
    // Arapça sağdan sola akar; flex/grid düzeni dir ile kendiliğinden aynalanır
    document.documentElement.dir = prefs.language === "ar" ? "rtl" : "ltr";
  }, [prefs]);

  /* ---------- Canlı kurlar ---------- */
  useEffect(() => {
    if (mode !== "ready") return;
    let cancelled = false;
    void ensureFx().then((table) => {
      if (!cancelled && table) setFx(table);
    });
    // Uygulama günlerce açık kalabilir (kurulu PWA/TWA); tabloyu tazele.
    const interval = setInterval(
      () => void ensureFx().then((table) => !cancelled && table && setFx(table)),
      6 * 60 * 60_000,
    );
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [mode]);

  /* ---------- Bildirimler ---------- */
  useEffect(() => {
    if (mode !== "ready" || !vault.notificationsEnabled) return;
    const opts = {
      lang: prefs.language,
      usdTry: vault.usdTry,
      eurTry: vault.eurTry,
      fx,
      home: prefs.displayCurrency,
    };
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
    prefs.displayCurrency,
    fx,
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

    // Saf hesap: updater dışında; StrictMode çifte çağrısında sayaç bozulmasın
    const dupeKey = (p: Payment) =>
      `${normalizeName(p.name)}|${p.nextPaymentDate}|${p.price}`;
    const existing = new Set(vaultRef.current.payments.map(dupeKey));
    const fresh: Payment[] = [];
    for (const p of payments) {
      const key = dupeKey(p);
      if (existing.has(key)) continue;
      existing.add(key);
      fresh.push(p);
    }
    added = fresh.length;
    if (fresh.length > 0) {
      touchVault((v) => ({ ...v, payments: [...v.payments, ...fresh] }));
    }

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
    await pullAndMerge(user?.uid);
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
    await pullAndMerge(user?.uid);
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
    setSubscription({ status: "none", currentPeriodEnd: null });
    setProfileOpen(false);
    setNeedsSyncKey(false);
    lastPushedAtRef.current = 0;
    // Yereldeki kasa çıkış yapan hesaba aitti; bir sonraki hesaba taşınmasın
    saveVaultOwner(null);
    setVault({ ...DEFAULT_VAULT, updatedAt: 0 });
    setToast(t("toast.signedOut"));
  }

  /** Uygulama içi hesap silme: bulut verisi + kimlik silinir, yerel sıfırlanır. */
  async function handleDeleteAccount(): Promise<void> {
    const result = await deleteCloudAccount();
    if (!result.ok) {
      setToast(t("account.error.generic", { msg: result.error ?? "error" }));
      return;
    }
    setCloudUser(null);
    setSubscription({ status: "none", currentPeriodEnd: null });
    setProfileOpen(false);
    setDeleteAccountOpen(false);
    saveVaultOwner(null);
    clearSyncKey();
    lastPushedAtRef.current = 0;
    setToast(t("account.deleted"));
  }

  async function handleCopyRecoveryKey(): Promise<void> {
    try {
      const key = await getRecoveryKey();
      await navigator.clipboard.writeText(key);
      setToast(t("account.syncKeyCopied"));
    } catch {
      setToast(t("account.error.generic", { msg: "clipboard" }));
    }
  }

  /** Ayarlar > tüm yerel verileri sil (PIN kilidi olmasa da erişilebilir). */
  function handleEraseLocal() {
    wipeAllData();
    clearSyncKey();
    sessionKeyRef.current = null;
    setPrefs({ ...DEFAULT_PREFS });
    setVault({ ...DEFAULT_VAULT, payments: [], updatedAt: Date.now() });
    setEraseConfirmOpen(false);
    setSettingsOpen(false);
    setToast(t("toast.erased"));
  }

  async function handleSyncNow(): Promise<void> {
    if (!cloudUser) return;
    if (premiumGateEnabled && !entitledRef.current) return;
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
      fx,
      home: prefs.displayCurrency,
    });
  }

  function handleDemo() {
    // Gerçek veri varken örnek veriler onaysız üzerine yazılmasın
    if (vault.payments.length > 0) {
      setDemoConfirmOpen(true);
      return;
    }
    loadDemoData();
  }

  function loadDemoData() {
    touchVault((v) => ({ ...v, payments: buildDemoPayments(prefs.language) }));
    setDemoConfirmOpen(false);
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
          fx,
          home: prefs.displayCurrency,
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
        ? filterAndSort(vault.payments, query, category, sort, vault, prefs.displayCurrency, fx)
        : [],
    [vault, mode, query, category, sort, prefs.displayCurrency, fx],
  );

  if (mode === "loading") return <div className="app" />;

  return (
    <I18nProvider lang={prefs.language} onChange={setLang}>
      {mode === "locked" ? (
        <LockScreen onUnlock={handleUnlock} onWipe={handleWipe} />
      ) : (
        <div
          className={`app ${
            vault.payments.length > 0 && !vault.notificationsEnabled && !bannerDismissed
              ? "has-banner"
              : ""
          }`}
        >
          <a className="skip-link" href="#main">
            {t("a11y.skipToContent")}
          </a>
          <Header
            onOpenSettings={() => setSettingsOpen(true)}
            onLock={prefs.lockEnabled ? handleLock : undefined}
            cloudEnabled={cloudEnabled}
            cloudUser={cloudUser}
            onOpenAccount={() => (cloudUser ? setProfileOpen(true) : setAuthOpen(true))}
          />

          <main className="container" id="main" tabIndex={-1}>
            {cloudEnabled &&
              !cloudUser &&
              !cloudBannerDismissed &&
              vault.payments.length > 0 && (
                <div className="cloud-banner">
                  <span className="cloud-banner-icon" aria-hidden="true">
                    ☁️
                  </span>
                  <span className="cloud-banner-text">{t("auth.banner.text")}</span>
                  <button
                    type="button"
                    className="btn btn-secondary cloud-banner-cta"
                    onClick={() => setAuthOpen(true)}
                  >
                    {t("auth.banner.btn")}
                  </button>
                  <button
                    type="button"
                    className="icon-btn cloud-banner-dismiss"
                    onClick={dismissCloudBanner}
                    aria-label={t("action.close")}
                  >
                    ✕
                  </button>
                </div>
              )}

            <SummaryCards
              payments={vault.payments}
              vault={vault}
              fx={fx}
              displayCurrency={prefs.displayCurrency}
            />

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
                  <div className="grid" ref={gridRef}>
                    {visiblePayments.map((payment) => (
                      <PaymentCard
                        key={payment.id}
                        payment={payment}
                        displayCurrency={prefs.displayCurrency}
                        fx={fx}
                        legacyRates={{ usdTry: vault.usdTry, eurTry: vault.eurTry }}
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
              displayCurrency={prefs.displayCurrency}
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
              confirmLabel={t("action.delete")}
              onCancel={() => setDeleteTarget(null)}
              onConfirm={confirmDelete}
            />
          )}

          {demoConfirmOpen && (
            <ConfirmModal
              message={t("confirm.demoReplace")}
              onCancel={() => setDemoConfirmOpen(false)}
              onConfirm={loadDemoData}
            />
          )}

          {eraseConfirmOpen && (
            <ConfirmModal
              message={t("confirm.eraseLocal")}
              confirmLabel={t("action.delete")}
              onCancel={() => setEraseConfirmOpen(false)}
              onConfirm={handleEraseLocal}
            />
          )}

          {deleteAccountOpen && (
            <ConfirmModal
              message={t("account.deleteWarn")}
              confirmLabel={t("account.deleteTitle")}
              onCancel={() => setDeleteAccountOpen(false)}
              onConfirm={() => void handleDeleteAccount()}
            />
          )}

          {needsSyncKey && (
            <SyncKeyModal
              onClose={() => setNeedsSyncKey(false)}
              onApply={async (key) => {
                const ok = await importRecoveryKey(key);
                if (!ok) return false;
                setNeedsSyncKey(false);
                const user = await getCloudUser();
                await pullAndMerge(user?.uid);
                return true;
              }}
            />
          )}

          {settingsOpen && (
            <SettingsModal
              prefs={prefs}
              vault={vault}
              fx={fx}
              onRefreshFx={async () => {
                const table = await ensureFx(true);
                if (table) setFx(table);
                return Boolean(table);
              }}
              onClose={() => setSettingsOpen(false)}
              onSavePrefs={(p) => {
                setPrefs(p);
                setSettingsOpen(false);
                setToast(t("toast.settingsSaved"));
              }}
              onSaveVault={(v) =>
                setVault((cur) => ({
                  ...cur,
                  // Ayarlar yalnızca bu dört alanın sahibi. Kasanın tamamını
                  // modalin açılış kopyasıyla ezmek, modal açıkken gelen her
                  // değişikliği (bulut senkronu, vade ilerletme, demo
                  // yeniden çevirisi) sessizce geri alıyordu.
                  reminderDays: v.reminderDays,
                  notificationsEnabled: v.notificationsEnabled,
                  usdTry: v.usdTry,
                  eurTry: v.eurTry,
                  updatedAt: Date.now(),
                }))
              }
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
              onEraseData={() => setEraseConfirmOpen(true)}
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
              subscription={subscription}
              onSyncNow={() => void handleSyncNow()}
              onDeleteAccount={() => setDeleteAccountOpen(true)}
              onCopyRecoveryKey={() => void handleCopyRecoveryKey()}
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

          {/* Kalıcı canlı bölge: ekran okuyucular metin değişimini duyurur */}
          <div
            className={`toast ${toast ? "" : "toast-hidden"}`}
            role="status"
            aria-live="polite"
          >
            {toast}
          </div>

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
      <div className="empty-hero" aria-hidden="true">
        <span className="empty-hero-icon">📡</span>
      </div>
      <h2>{t("empty.title")}</h2>
      <p>{t("empty.body")}</p>
      <div className="empty-actions">
        <button className="btn btn-primary" onClick={onAdd}>
          {t("empty.addFirst")}
        </button>
        <button className="btn btn-secondary" onClick={onDemo}>
          <span aria-hidden="true">✨</span> {t("empty.tryDemo")}
        </button>
      </div>
      <div className="empty-badges" aria-hidden="true">
        <span>🏠</span>
        <span>🚗</span>
        <span>🧾</span>
        <span>📺</span>
        <span>🏦</span>
        <span>📜</span>
        <span>🎮</span>
        <span>🛡️</span>
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
          aria-label={t("action.close")}
          title={t("action.close")}
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
      language === "tr" || language === "en" || language === "ms" ||
      language === "es" || language === "ar"
        ? language
        : undefined,
  });
}

function filterAndSort(
  payments: Payment[],
  query: string,
  category: CategoryId | "all",
  sort: SortKey,
  vault: VaultData,
  displayCurrency: Currency,
  fx: FxTable | null,
): Payment[] {
  const home = displayCurrency;
  const legacyRates = { usdTry: vault.usdTry, eurTry: vault.eurTry };
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
          toMonthlyIn(b, home, fx, legacyRates) - toMonthlyIn(a, home, fx, legacyRates),
      );
      break;
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "tr"));
      break;
  }
  return sorted;
}

