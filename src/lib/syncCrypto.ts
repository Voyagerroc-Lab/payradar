import {
  decryptJSON,
  deriveVaultKey,
  encryptJSON,
  importKeyBase64,
  type EncryptedPayload,
} from "./crypto";

/**
 * Bulut senkronu için şifreleme.
 *
 * Vault, buluta gitmeden önce AES-256-GCM ile şifrelenir. Anahtar hiçbir
 * yerde saklanmaz: her cihazda Google hesabının kullanıcı kimliğinden
 * (Supabase uid) PBKDF2 ile yeniden türetilir. Aynı hesapla giren her cihaz
 * aynı anahtara ulaştığı için senkron kendiliğinden çalışır — kullanıcıdan
 * kurtarma anahtarı istenmez, kaybedilecek bir anahtar da yoktur.
 *
 * Bunun bilinçli bedeli: anahtar hesabın kimliğinden türediği için artık
 * "sunucunun asla çözemeyeceği" bir uçtan uca şifreleme değil, kimliğe bağlı
 * bir dinlenme hâli şifrelemesidir. Satırı okuyan üçüncü bir taraf düz metni
 * göremez; sırlar sunucuda durmaz.
 *
 * ev:1 zarfları eski sürümün cihaz-yerel rastgele anahtarıyla yazılmıştı.
 * O anahtar hâlâ bu cihazdaysa okunur ve ilk yazımda ev:2'ye taşınır.
 */

/** Eski (cihaz-yerel, rastgele) senkron anahtarı — yalnızca okuma/göç için. */
const LEGACY_KEY_STORAGE = "payradar:syncKey:v1";

/** PBKDF2 tuzu: uid ile birlikte anahtarı bu uygulamaya bağlar. */
const KEY_SALT = "payradar:sync:v2";

/** Şifreli bulut yükü — düz metin vault yerine bu yazılır. */
export interface EncryptedVaultEnvelope {
  /** Şema sürümü: 1 = cihaz anahtarı (eski), 2 = hesap anahtarı,
      3 = hesap anahtarı + updatedAt GCM AAD'sinde (bütünlük korumalı) */
  ev: 1 | 2 | 3;
  payload: EncryptedPayload;
  /** Çakışma çözümü sunucuda düz metin okumadan yapılabilsin diye açıkta.
      ev:3'te bu alan AAD olarak imzalıdır: zarfa dokunmadan değiştirilirse
      çözme başarısız olur — LWW kararı oynanabilir bir alandan çıkmaz. */
  updatedAt: number;
}

export function isEncryptedEnvelope(raw: unknown): raw is EncryptedVaultEnvelope {
  if (typeof raw !== "object" || raw === null) return false;
  const r = raw as Record<string, unknown>;
  return (
    (r.ev === 1 || r.ev === 2 || r.ev === 3) &&
    typeof r.payload === "object" &&
    r.payload !== null
  );
}

/* PBKDF2 pahalıdır (600k iterasyon); oturum boyunca tek türetme yeter. */
let cached: { uid: string; key: CryptoKey } | null = null;

/** Hesap kimliğinden senkron anahtarını türetir (oturum içinde önbelleklenir). */
async function accountKey(uid: string): Promise<CryptoKey> {
  if (cached?.uid === uid) return cached.key;
  const key = await deriveVaultKey(uid, KEY_SALT);
  cached = { uid, key };
  return key;
}

function readLegacyKey(): string | null {
  try {
    return localStorage.getItem(LEGACY_KEY_STORAGE);
  } catch {
    return null;
  }
}

/** Türetilmiş anahtarı ve varsa eski cihaz anahtarını unutur (çıkış/silme). */
export function clearSyncKey(): void {
  cached = null;
  try {
    localStorage.removeItem(LEGACY_KEY_STORAGE);
  } catch {
    /* önemsiz */
  }
}

/** AAD dizgesi: updatedAt tek başına değil, alan adıyla bağlanır. */
function aadFor(updatedAt: number): string {
  return `payradar:updatedAt:${updatedAt}`;
}

export async function encryptVault(
  value: unknown,
  updatedAt: number,
  uid: string,
): Promise<EncryptedVaultEnvelope> {
  const key = await accountKey(uid);
  return { ev: 3, payload: await encryptJSON(key, value, aadFor(updatedAt)), updatedAt };
}

/**
 * Zarfı çözer; çözülemezse null döner (veri kaybı yaşanmaz, çağıran karar verir).
 * ev:3/ev:2 hesabın anahtarıyla, ev:1 bu cihazda kalmış eski anahtarla açılır.
 */
export async function decryptVault<T>(
  envelope: EncryptedVaultEnvelope,
  uid: string,
): Promise<T | null> {
  if (envelope.ev === 3 || envelope.ev === 2) {
    try {
      return await decryptJSON<T>(
        await accountKey(uid),
        envelope.payload,
        envelope.ev === 3 ? aadFor(envelope.updatedAt) : undefined,
      );
    } catch {
      return null;
    }
  }

  const legacy = readLegacyKey();
  if (!legacy) return null;
  try {
    return await decryptJSON<T>(await importKeyBase64(legacy), envelope.payload);
  } catch {
    return null;
  }
}
