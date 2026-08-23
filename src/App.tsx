import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CategoryId, Language, Payment, Prefs, VaultData } from "./types";
import {
  DEFAULT_PREFS,
  DEFAULT_VAULT,
  changePin,
  disableLock,
  enableLock,
  isVaultLocked,
  loadPrefs,
  loadUnlockedVault,
  saveLockedVault,
  savePrefs,
  saveUnlockedVault,
  unlockVault,
  wipeAllData,
} from "./lib/storage";
import { checkUpcomingPayments, requestNotificationPermission } from "./lib/notify";
import { buildDemoPayments } from "./lib/demo";
import { monthlyAmount, nextOccurrence } from "./lib/format";
import { getGuideOrGeneric } from "./data/guides";
import { I18nProvider, useI18n } from "./i18n";
import { makeT } from "./i18n/t";
import Header from "./components/Header";
import SummaryCards from "./components/SummaryCards";
import Toolbar, { type SortKey } from "./components/Toolbar";
import PaymentCard from "./components/PaymentCard";
import PaymentFormModal from "./components/PaymentFormModal";
import GuideModal from "./components/GuideModal";
import SettingsModal from "./components/SettingsModal";
import LockScreen from "./components/LockScreen";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const t = useMemo(() => makeT(prefs.language), [prefs.language]);

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
    checkUpcomingPayments(vault.payments, vault.reminderDays);
  }, [vault.payments, vault.notificationsEnabled, vault.reminderDays, mode]);

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
    setVault({ ...DEFAULT_VAULT, payments: [] });
    setMode("ready");
  }

  /* ---------- Ödeme işlemleri ---------- */
  function handleSave(payment: Payment) {
    setVault((v) => {
      const index = v.payments.findIndex((x) => x.id === payment.id);
      const payments =
        index === -1
          ? [...v.payments, payment]
          : v.payments.map((x, i) => (i === index ? payment : x));
      return { ...v, payments };
    });
    setEditor(null);
    setToast(t("toast.saved"));
  }

  function handleDelete(id: string) {
    const payment = vault.payments.find((p) => p.id === id);
    if (!payment) return;
    if (!window.confirm(t("confirm.deletePayment", { name: payment.name }))) return;
    setVault((v) => ({ ...v, payments: v.payments.filter((p) => p.id !== id) }));
    setToast(t("toast.deleted"));
  }

  function handleDemo() {
    setVault((v) => ({ ...v, payments: buildDemoPayments() }));
    setToast(t("toast.demoLoaded"));
  }

  function handleEnableNotifications() {
    void requestNotificationPermission().then((granted) => {
      if (granted) {
        setVault((v) => ({ ...v, notificationsEnabled: true }));
        checkUpcomingPayments(vault.payments, vault.reminderDays);
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
          />

          <main className="container">
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
              guide={getGuideOrGeneric(guideFor.name)}
              serviceName={guideFor.name}
              onClose={() => setGuideFor(null)}
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
              onSaveVault={(v) => setVault(v)}
              onEnableLock={handleEnableLock}
              onChangePin={handleChangePin}
              onDisableLock={handleDisableLock}
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
        </div>
      )}
    </I18nProvider>
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

function toTryPerMonth(payment: Payment, vault: VaultData): number {
  let amount = monthlyAmount(payment.price, payment.billingCycle);
  if (payment.currency === "USD") amount *= vault.usdTry || 1;
  if (payment.currency === "EUR") amount *= vault.eurTry || 1;
  return amount;
}

function filterAndSort(
  payments: Payment[],
  query: string,
  category: CategoryId | "all",
  sort: SortKey,
  vault: VaultData,
): Payment[] {
  const q = query.toLocaleLowerCase("tr-TR").trim();
  let result = payments;

  if (category !== "all") result = result.filter((p) => p.categoryId === category);
  if (q) result = result.filter((p) => p.name.toLocaleLowerCase("tr-TR").includes(q));

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
      sorted.sort((a, b) => toTryPerMonth(b, vault) - toTryPerMonth(a, vault));
      break;
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "tr"));
      break;
  }
  return sorted;
}

