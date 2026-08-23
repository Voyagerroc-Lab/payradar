/**
 * PIN tabanlı şifreleme:
 * - Anahtar türetme: PBKDF2-SHA256 (150.000 iterasyon)
 * - Veri şifreleme: AES-256-GCM (rastgele IV)
 * - Doğrulama: ayrı türetilmiş hash ile PIN kontrolü
 * Anahtar yalnızca bellekte tutulur, asla saklanmaz.
 */

const PBKDF2_ITERATIONS = 150_000;

type Bytes = Uint8Array<ArrayBuffer>;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomSaltHex(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bytesToHex(salt);
}

async function deriveBits(pin: string, saltHex: string): Promise<Bytes> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin) as Bytes,
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(saltHex) as Bytes,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  return new Uint8Array(bits);
}

/** PIN doğrulaması için karşılaştırma hash'i üretir. */
export async function hashPin(pin: string, saltHex: string): Promise<string> {
  const bits = await deriveBits(`${pin}#verify`, saltHex);
  return bytesToHex(bits);
}

/** Veri şifrelemede kullanılacak AES-GCM anahtarını üretir. */
export async function deriveVaultKey(pin: string, saltHex: string): Promise<CryptoKey> {
  const bits = await deriveBits(`${pin}#data`, saltHex);
  return crypto.subtle.importKey("raw", bits, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function fromBase64(base64: string): Bytes {
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export interface EncryptedPayload {
  iv: string;
  data: string;
}

export async function encryptJSON(key: CryptoKey, value: unknown): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value)) as Bytes;
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return { iv: bytesToHex(iv), data: toBase64(new Uint8Array(ciphertext)) };
}

export async function decryptJSON<T>(key: CryptoKey, payload: EncryptedPayload): Promise<T> {
  const iv = fromBase64(payload.iv);
  const ciphertext = fromBase64(payload.data);
  // GCM doğrulaması başarısızsa burada hata fırlar (yanlış PIN sinyali).
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}
