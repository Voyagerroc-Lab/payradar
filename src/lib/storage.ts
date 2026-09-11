import type { Payment, Prefs, VaultData } from "../types";
import { sanitizeCategoryFields } from "./format";
import { homeCurrency } from "./fx";
import {
  LEGACY_PBKDF2_ITERATIONS,
  PBKDF2_ITERATIONS,
  decryptJSON,
  deriveVaultKey,
  encryptJSON,
  hashPin,
  randomSaltHex,
  type EncryptedPayload,
} from "./crypto";

const PREFS_KEY = "payradar:prefs:v1";
const VAULT_KEY = "payradar:vault:v1";
const LAST_SYNC_KEY = "payradar:lastSync:v1";
const VAULT_OWNER_KEY = "payradar:vaultOwner:v1";
const NOTIFIED_KEY = "payradar:notified";

/** Yereldeki vault'un hangi bulut hesabına ait olduğu; hesap değişince veri karışmasın diye. */
export function loadVaultOwner(): string | null {
  try {
    return localStorage.getItem(VAULT_OWNER_KEY);
  } catch {
    return null;
  }
}

export function saveVaultOwner(uid: string | null): void {
  try {
    if (uid) localStorage.setItem(VAULT_OWNER_KEY, uid);
    else localStorage.removeItem(VAULT_OWNER_KEY);
  } catch {
    /* önemsiz */
  }
}
/** Eski uygulamanın anahtarları — bir kereliğine migrate edilir */
const LEGACY_SUBS_KEY = "abonelik-takipci:subscriptions:v1";

export function loadLastSync(): number {
  try {
    return Number(localStorage.getItem(LAST_SYNC_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function saveLastSync(ts: number): void {
  try {
    localStorage.setItem(LAST_SYNC_KEY, String(ts));
  } catch {
    /* önemsiz */
  }
}

export const DEFAULT_PREFS: Prefs = {
  language: detectLanguage(),
  theme: "auto",
  // İlk kurulumda dile göre makul varsayılan; sonrası tamamen kullanıcının
  displayCurrency: homeCurrency(detectLanguage()),
  lockEnabled: false,
  autoLockMinutes: 5,
};

export const DEFAULT_VAULT: VaultData = {
  payments: [],
  reminderDays: 3,
  notificationsEnabled: false,
  usdTry: 42,
  eurTry: 48,
  updatedAt: 0,
};

interface VaultFile {
  v: 1;
  locked: boolean;
  /** locked=true iken dolu */
  salt?: string;
  verify?: string;
  payload?: EncryptedPayload;
  /** Bu kasanın türetme iterasyonu; yoksa eski (150k) kasadır */
  it?: number;
  /** locked=false iken dolu */
  data?: VaultData;
}

function detectLanguage(): "tr" | "en" | "ms" | "es" | "ar" {
  const lang = navigator.language?.toLowerCase() ?? "";
  if (lang.startsWith("tr")) return "tr";
  if (lang.startsWith("ms")) return "ms";
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("ar")) return "ar";
  return "en";
}

/* ---------------- Prefs ---------------- */

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* depolama dolu/kapalı olabilir; tercihler bu oturumda bellekte yaşar */
  }
}

/* ---------------- Vault ---------------- */

export function isVaultLocked(): boolean {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return false;
    return Boolean(JSON.parse(raw).locked);
  } catch {
    return false;
  }
}

/** Kilitli olmayan vault verisini okur (migrasyon dahil). */
export function loadUnlockedVault(): VaultData {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (raw) {
      const file = JSON.parse(raw) as VaultFile;
      if (!file.locked && file.data) return sanitize(file.data);
    }
  } catch {
    /* bozuk veri -> varsayılana dön */
  }
  return migrateLegacy();
}

export function saveUnlockedVault(data: VaultData): void {
  // updatedAt'e DOKUNMA: yalnızca gerçek içerik değişikliği (touchVault) damgalamalı,
  // yoksa uygulamayı açmak bile saati ilerletip senkron çakışmasını yanlış çözer.
  const file: VaultFile = { v: 1, locked: false, data };
  try {
    localStorage.setItem(VAULT_KEY, JSON.stringify(file));
  } catch {
    /* depolama dolu/kapalı olabilir; veri bellekte yaşamaya devam eder */
  }
}

export async function enableLock(
  currentData: VaultData,
  pin: string,
): Promise<void> {
  const salt = randomSaltHex();
  const [key, verify] = await Promise.all([
    deriveVaultKey(pin, salt),
    hashPin(pin, salt),
  ]);
  const payload = await encryptJSON(key, currentData);
  const file: VaultFile = {
    v: 1,
    locked: true,
    salt,
    verify,
    payload,
    it: PBKDF2_ITERATIONS,
  };
  localStorage.setItem(VAULT_KEY, JSON.stringify(file));
}

/** Doğru PIN ile şifreli vaultu açar; yanlış PIN'de null döner. */
export async function unlockVault(
  pin: string,
): Promise<{ data: VaultData; key: CryptoKey } | null> {
  let file: VaultFile;
  try {
    file = JSON.parse(localStorage.getItem(VAULT_KEY) ?? "") as VaultFile;
  } catch {
    return null;
  }
  if (!file.locked || !file.salt || !file.verify || !file.payload) return null;

  // Eski kasalar 150k ile türetilmişti; dosya kendi iterasyonunu taşır.
  const iterations = file.it ?? LEGACY_PBKDF2_ITERATIONS;
  const verify = await hashPin(pin, file.salt, iterations);
  // timing-safe karşılaştırma için sabit uzunlukta XOR
  if (!timingSafeEqual(verify, file.verify)) return null;

  try {
    const key = await deriveVaultKey(pin, file.salt, iterations);
    const data = sanitize(await decryptJSON<VaultData>(key, file.payload));
    return { data, key };
  } catch {
    return null;
  }
}

/** Açık oturumda veriyi mevcut anahtarla yeniden şifreleyip yazar. */
export async function saveLockedVault(
  key: CryptoKey,
  data: VaultData,
): Promise<void> {
  let file: VaultFile;
  try {
    file = JSON.parse(localStorage.getItem(VAULT_KEY) ?? "{}") as VaultFile;
  } catch {
    return;
  }
  if (!file.locked || !file.salt || !file.verify) return;
  file.payload = await encryptJSON(key, data);
  localStorage.setItem(VAULT_KEY, JSON.stringify(file));
}

/** PIN değiştirme: veriyi yeni PIN ile yeniden şifreler. */
export async function changePin(oldPin: string, newPin: string): Promise<boolean> {
  const opened = await unlockVault(oldPin);
  if (!opened) return false;
  const salt = randomSaltHex();
  const [newKey, verify] = await Promise.all([
    deriveVaultKey(newPin, salt),
    hashPin(newPin, salt),
  ]);
  const payload = await encryptJSON(newKey, opened.data);
  const file: VaultFile = { v: 1, locked: true, salt, verify, payload, it: PBKDF2_ITERATIONS };
  localStorage.setItem(VAULT_KEY, JSON.stringify(file));
  return true;
}

export async function disableLock(pin: string): Promise<VaultData | null> {
  const opened = await unlockVault(pin);
  if (!opened) return null;
  saveUnlockedVault(opened.data);
  return opened.data;
}

/** Tüm yerel veriyi kalıcı olarak siler (PIN unutma ve "verileri sil" yolu). */
export function wipeAllData(): void {
  localStorage.removeItem(PREFS_KEY);
  localStorage.removeItem(VAULT_KEY);
  localStorage.removeItem(LAST_SYNC_KEY);
  localStorage.removeItem(VAULT_OWNER_KEY);
  localStorage.removeItem(NOTIFIED_KEY);
  localStorage.removeItem(LEGACY_SUBS_KEY);
}

/* ---------------- Migrasyon & doğrulama ---------------- */

export function sanitize(data: Partial<VaultData>): VaultData {
  return {
    ...DEFAULT_VAULT,
    ...data,
    payments: Array.isArray(data.payments)
      ? (data.payments.filter(isValidPayment) as Payment[]).map(sanitizeCategoryFields)
      : [],
  };
}

function isValidPayment(value: unknown): value is Payment {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.price === "number" &&
    Number.isFinite(p.price) &&
    p.price > 0 &&
    typeof p.nextPaymentDate === "string" &&
    // tüm üreticiler (form, CSV, demo) yyyy-mm-dd yazar; NaN vadeli bozuk
    // satır sanitize kapısından geçmesin
    /^\d{4}-\d{2}-\d{2}$/.test(p.nextPaymentDate) &&
    typeof p.categoryId === "string"
  );
}

/** Eski abonelik-takipci verisini yeni modele taşır. */
function migrateLegacy(): VaultData {
  try {
    const raw = localStorage.getItem(LEGACY_SUBS_KEY);
    if (!raw) return { ...DEFAULT_VAULT };
    const legacy = JSON.parse(raw) as Array<Record<string, unknown>>;

    const categoryMap: Record<string, string> = {
      video: "abonelik",
      muzik: "abonelik",
      oyun: "oyun",
      bulut: "yazilim",
      yazilim: "diger",
      egitim: "egitim",
      spor: "saglik",
      diger: "diger",
    };

    const payments = legacy
      .filter(
        (s) =>
          typeof s.id === "string" &&
          typeof s.nextPaymentDate === "string" &&
          s.nextPaymentDate !== "",
      )
      .map((s) => ({
        id: s.id as string,
        name: String(s.name ?? ""),
        price: Number(s.price ?? 0),
        currency: (s.currency as Payment["currency"]) ?? "TRY",
        billingCycle:
          (s.billingCycle as Payment["billingCycle"]) === "yearly"
            ? "yearly"
            : ("monthly" as Payment["billingCycle"]),
        nextPaymentDate: String(s.nextPaymentDate ?? ""),
        categoryId: (categoryMap[String(s.categoryId)] ??
          "diger") as Payment["categoryId"],
        notes: s.notes as string | undefined,
        createdAt: Number(s.createdAt ?? Date.now()),
      }));

    // sanitize: geçersiz kayıtları ve kategori-dışı alanları ele alır — eski
    // verinin bozuk bir satırı "NaN" vadeli kart üretmesin
    const data = sanitize({ ...DEFAULT_VAULT, payments });
    saveUnlockedVault(data);
    return data;
  } catch {
    return { ...DEFAULT_VAULT };
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
