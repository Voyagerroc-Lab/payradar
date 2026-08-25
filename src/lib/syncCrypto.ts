import {
  decryptJSON,
  encryptJSON,
  exportKeyBase64,
  generateDataKey,
  importKeyBase64,
  type EncryptedPayload,
} from "./crypto";

/**
 * Bulut senkronu için uçtan uca şifreleme.
 *
 * Vault, buluta gitmeden önce cihazda üretilen rastgele bir AES-256-GCM
 * anahtarıyla şifrelenir. Anahtar YALNIZCA cihazda (localStorage) durur ve
 * sunucuya hiç gönderilmez — Supabase yalnızca şifreli bloğu görür.
 *
 * Bunun bilinçli sonucu: anahtar başka cihazda yoksa oradaki veri çözülemez.
 * Bu yüzden kullanıcıya "Kurtarma anahtarı" olarak gösterilip ikinci cihaza
 * elle taşınabiliyor (Ayarlar > Hesap). Anahtar kaybolursa buluttaki kopya
 * kurtarılamaz; bu, sunucunun düz metni görmemesinin bedelidir.
 */

const SYNC_KEY_STORAGE = "payradar:syncKey:v1";

/** Şifreli bulut yükü — düz metin vault yerine bu yazılır. */
export interface EncryptedVaultEnvelope {
  /** Şema sürümü; ileride algoritma değişirse ayırt etmek için */
  ev: 1;
  payload: EncryptedPayload;
  /** Çakışma çözümü sunucuda düz metin okumadan yapılabilsin diye açıkta */
  updatedAt: number;
}

export function isEncryptedEnvelope(raw: unknown): raw is EncryptedVaultEnvelope {
  if (typeof raw !== "object" || raw === null) return false;
  const r = raw as Record<string, unknown>;
  return r.ev === 1 && typeof r.payload === "object" && r.payload !== null;
}

function readStoredKey(): string | null {
  try {
    return localStorage.getItem(SYNC_KEY_STORAGE);
  } catch {
    return null;
  }
}

function writeStoredKey(base64: string): void {
  try {
    localStorage.setItem(SYNC_KEY_STORAGE, base64);
  } catch {
    /* depolama kapalıysa senkron şifrelenemez; çağıran hatayı görür */
  }
}

export function clearSyncKey(): void {
  try {
    localStorage.removeItem(SYNC_KEY_STORAGE);
  } catch {
    /* önemsiz */
  }
}

export function hasSyncKey(): boolean {
  return Boolean(readStoredKey());
}

/** Cihazdaki senkron anahtarını döndürür; yoksa üretip saklar. */
export async function getOrCreateSyncKey(): Promise<CryptoKey> {
  const stored = readStoredKey();
  if (stored) return importKeyBase64(stored);
  const key = await generateDataKey();
  writeStoredKey(await exportKeyBase64(key));
  return key;
}

/** Kullanıcıya gösterilecek/yedeklenecek kurtarma anahtarı (base64). */
export async function getRecoveryKey(): Promise<string> {
  const stored = readStoredKey();
  if (stored) return stored;
  const key = await getOrCreateSyncKey();
  return exportKeyBase64(key);
}

/** Başka cihazdan taşınan kurtarma anahtarını kurar. Geçersizse false döner. */
export async function importRecoveryKey(base64: string): Promise<boolean> {
  const trimmed = base64.trim();
  if (!trimmed) return false;
  try {
    await importKeyBase64(trimmed); // doğrula
    writeStoredKey(trimmed);
    return true;
  } catch {
    return false;
  }
}

export async function encryptVault(value: unknown, updatedAt: number): Promise<EncryptedVaultEnvelope> {
  const key = await getOrCreateSyncKey();
  return { ev: 1, payload: await encryptJSON(key, value), updatedAt };
}

/** Zarfı çözer; anahtar yanlış/eksikse null döner (veri kaybı yaşanmaz). */
export async function decryptVault<T>(envelope: EncryptedVaultEnvelope): Promise<T | null> {
  const stored = readStoredKey();
  if (!stored) return null;
  try {
    const key = await importKeyBase64(stored);
    return await decryptJSON<T>(key, envelope.payload);
  } catch {
    return null;
  }
}
