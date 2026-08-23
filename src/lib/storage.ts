import type { Payment, Prefs, VaultData } from "../types";
import {
  decryptJSON,
  deriveVaultKey,
  encryptJSON,
  hashPin,
  randomSaltHex,
  type EncryptedPayload,
} from "./crypto";

const PREFS_KEY = "payradar:prefs:v1";
const VAULT_KEY = "payradar:vault:v1";
/** Eski uygulamanın anahtarları — bir kereliğine migrate edilir */
const LEGACY_SUBS_KEY = "abonelik-takipci:subscriptions:v1";

export const DEFAULT_PREFS: Prefs = {
  language: detectLanguage(),
  theme: "auto",
  lockEnabled: false,
  autoLockMinutes: 5,
};

export const DEFAULT_VAULT: VaultData = {
  payments: [],
  reminderDays: 3,
  notificationsEnabled: false,
  usdTry: 42,
  eurTry: 48,
};

interface VaultFile {
  v: 1;
  locked: boolean;
  /** locked=true iken dolu */
  salt?: string;
  verify?: string;
  payload?: EncryptedPayload;
  /** locked=false iken dolu */
  data?: VaultData;
}

function detectLanguage(): "tr" | "en" {
  return navigator.language?.toLowerCase().startsWith("tr") ? "tr" : "en";
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
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
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
  const file: VaultFile = { v: 1, locked: false, data };
  localStorage.setItem(VAULT_KEY, JSON.stringify(file));
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

  const verify = await hashPin(pin, file.salt);
  // timing-safe karşılaştırma için sabit uzunlukta XOR
  if (!timingSafeEqual(verify, file.verify)) return null;

  try {
    const key = await deriveVaultKey(pin, file.salt);
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
}/** PIN değiştirme: veriyi yeni PIN ile yeniden şifreler. */
export async function changePin(oldPin: string, newPin: string): Promise<boolean> {
  const opened = await unlockVault(oldPin);
  if (!opened) return false;
  const salt = randomSaltHex();
  const [newKey, verify] = await Promise.all([
    deriveVaultKey(newPin, salt),
    hashPin(newPin, salt),
  ]);
  const payload = await encryptJSON(newKey, opened.data);
  const file: VaultFile = { v: 1, locked: true, salt, verify, payload };
  localStorage.setItem(VAULT_KEY, JSON.stringify(file));
  return true;
}

export async function disableLock(pin: string): Promise<VaultData | null> {
  const opened = await unlockVault(pin);
  if (!opened) return null;
  saveUnlockedVault(opened.data);
  return opened.data;
}

/** Unutulan PIN: tüm veriyi kalıcı olarak siler. */
export function wipeAllData(): void {
  localStorage.removeItem(PREFS_KEY);
  localStorage.removeItem(VAULT_KEY);
  localStorage.removeItem(LEGACY_SUBS_KEY);
}

/* ---------------- Migrasyon & doğrulama ---------------- */

function sanitize(data: Partial<VaultData>): VaultData {
  return {
    ...DEFAULT_VAULT,
    ...data,
    payments: Array.isArray(data.payments)
      ? (data.payments.filter(isValidPayment) as Payment[])
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
    typeof p.nextPaymentDate === "string" &&
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
      .filter((s) => typeof s.id === "string")
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

    const data: VaultData = { ...DEFAULT_VAULT, payments };
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
