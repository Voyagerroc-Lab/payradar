import { createClient } from "@supabase/supabase-js";
import { decryptVault, encryptVault, isEncryptedEnvelope } from "./syncCrypto";

/**
 * Bulut senkronizasyonu (opsiyonel).
 * .env dosyasına şunları ekleyince etkinleşir:
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJ...
 * Anahtarlar yoksa uygulama %100 yerel modda çalışmaya devam eder.
 *
 * Tek kimlik yöntemi Google hesabıdır: uygulama şifre saklamaz, e-posta
 * doğrulama/SMS akışı yürütmez. Vault'un şifreleme anahtarı da bu hesabın
 * kimliğinden türer (lib/syncCrypto.ts).
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const cloudEnabled = Boolean(url && anonKey);

/* PKCE zorunlu. auth-js varsayılanı "implicit": adres çubuğundaki fragman'da
   gelen bir access_token'ı state/nonce doğrulaması OLMADAN benimsiyor. Bu,
   saldırganın kendi oturumunu kurbanın uygulamasına iliştirmesine (session
   fixation) ve kurbanın ödeme kayıtlarının saldırganın satırına yazılmasına
   izin veriyordu. PKCE'de yerelde saklanan code_verifier şart olduğu için
   dışarıdan enjekte edilen bir jeton/kod kabul edilmez. */
export const supabase = cloudEnabled
  ? createClient(url!, anonKey!, { auth: { flowType: "pkce" } })
  : null;

export interface CloudUser {
  email?: string;
  /** Google profilindeki ad; yoksa e-postanın @ öncesi kullanılır */
  displayName?: string;
  uid?: string;
  createdAt?: string;
}

export async function getCloudUser(): Promise<CloudUser | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) return null;
  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const email = data.user.email;
  const metaName = [meta.full_name, meta.name, meta.display_name].find(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  return {
    email,
    displayName: metaName ?? email.split("@")[0],
    uid: data.user.id,
    createdAt: data.user.created_at,
  };
}

/** Oturumdaki kullanıcı kimliği — ağ isteği yapmaz, yerel oturumdan okur. */
async function currentUid(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/** Google OAuth ile giriş — tarayıcı Google'a yönlendirilir, dönüşte oturum açılır. */
export async function signInGoogle(): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "cloud-disabled" };
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    // origin değil tam adres: alt dizinde barınan kurulumlar (ör. /payradar/) köke düşmesin
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/**
 * Oturum dışarıdan açıldığında (OAuth dönüşü, başka sekmede giriş) haber verir.
 * Aboneliği kaldıran bir fonksiyon döner.
 */
export function onAuthChange(cb: () => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN") cb();
  });
  return () => data.subscription.unsubscribe();
}

export async function signOutCloud(): Promise<void> {
  await supabase?.auth.signOut();
}

/**
 * Kullanıcının kendi satırından vault'u çeker ve çözer.
 * Çözülemeyen satır `unreadable: true` ile döner: eski sürümde bu cihazda
 * olmayan bir anahtarla yazılmış kayıttır; çağıran onu ezip ezmeyeceğine
 * karar verir (App.pullAndMerge boş yereli asla yukarı yazmaz).
 * Eski (şifresiz) satırlar da okunur ve ilk push'ta şifreliye dönüşür.
 */
export async function pullVaultData(): Promise<
  { data: unknown; updatedAt: number; unreadable?: boolean; legacy?: boolean } | null
> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("vaults")
    .select("data,updated_at")
    .maybeSingle();
  if (error || !data) return null;

  const remoteUpdatedAt = new Date(data.updated_at).getTime();
  const raw = data.data;

  if (isEncryptedEnvelope(raw)) {
    const uid = await currentUid();
    const decrypted = uid
      ? await decryptVault<Record<string, unknown>>(raw, uid)
      : null;
    if (!decrypted) {
      return { data: null, updatedAt: raw.updatedAt || remoteUpdatedAt, unreadable: true };
    }
    // legacy: satır eski biçimde (ev:1 cihaz anahtarı ya da ev:2 AAD'siz);
    // çağıran güncel zarfla yeniden yazsın ki hem diğer cihazlar açabilsin
    // hem de updatedAt bütünlük korumasına kavuşsun
    return {
      data: decrypted,
      updatedAt: raw.updatedAt || remoteUpdatedAt,
      legacy: raw.ev !== 3,
    };
  }

  // Geriye dönük: şifrelemeden önce yazılmış düz metin satır
  return { data: raw, updatedAt: remoteUpdatedAt, legacy: true };
}

/** Vault'u cihazda şifreleyip kullanıcının satırına yazar. */
export async function pushVaultData(data: unknown): Promise<boolean> {
  if (!supabase) return false;
  const uid = await currentUid();
  if (!uid) return false; // oturum yoksa yazma
  const updatedAt =
    typeof (data as { updatedAt?: unknown })?.updatedAt === "number"
      ? ((data as { updatedAt: number }).updatedAt as number)
      : Date.now();
  let envelope;
  try {
    envelope = await encryptVault(data, updatedAt, uid);
  } catch {
    return false; // şifreleme mümkün değilse düz metin GÖNDERME
  }

  /* Korumalı yazım: push_vault() RPC'si satırı yalnızca yeni updatedAt,
     sunucudakinden küçük DEĞİLSE günceller — saati geri kalmış bir cihaz ya
     da iki cihazın yarışan push'ları, daha yeni veriyi sessizce ezemez.
     RPC henüz kurulmamışsa (supabase-setup.sql çalıştırılmamış eski proje)
     eski davranışa, koşulsuz upsert'e düşülür. */
  const { data: accepted, error } = await supabase.rpc("push_vault", { envelope });
  // false = sunucu daha yeni bir kaydı korudu; başarı sayma ki kullanıcı
  // "eşitlendi" sanmasın (bir sonraki açılışta pull güncel veriyi indirir)
  if (!error) return accepted !== false;
  if (error.code === "PGRST202" || error.code === "42883") {
    const { error: upsertErr } = await supabase.from("vaults").upsert({
      data: envelope,
      updated_at: new Date().toISOString(),
    });
    return !upsertErr;
  }
  return false;
}

/**
 * Hesabı ve buluttaki tüm verisini kalıcı olarak siler (uygulama içi hesap silme).
 * Sunucuda delete_own_account() yalnızca auth.uid()'in kendi kaydını siler.
 */
export async function deleteCloudAccount(): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "cloud-disabled" };
  const { error } = await supabase.rpc("delete_own_account");
  if (error) return { ok: false, error: error.message };
  await supabase.auth.signOut();
  return { ok: true };
}
