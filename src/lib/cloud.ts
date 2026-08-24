import { createClient } from "@supabase/supabase-js";

/**
 * Bulut senkronizasyonu (opsiyonel).
 * .env dosyasına şunları ekleyince etkinleşir:
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJ...
 * Anahtarlar yoksa uygulama %100 yerel modda çalışmaya devam eder.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const cloudEnabled = Boolean(url && anonKey);

export const supabase = cloudEnabled ? createClient(url!, anonKey!) : null;

export interface CloudUser {
  email?: string;
  phone?: string;
  /** Kayıt sırasında girilen ad; yoksa e-postanın @ öncesi kullanılır */
  displayName?: string;
  uid?: string;
  createdAt?: string;
}

export async function getCloudUser(): Promise<CloudUser | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email && !data.user?.phone) return null;
  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const email = data.user.email || undefined;
  const metaName = [meta.display_name, meta.full_name, meta.name].find(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  return {
    email,
    phone: data.user.phone || undefined,
    displayName: metaName ?? (email ? email.split("@")[0] : undefined),
    uid: data.user.id,
    createdAt: data.user.created_at,
  };
}

export async function signUpEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<{ ok: boolean; needsConfirm?: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "cloud-disabled" };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: displayName ? { data: { display_name: displayName } } : undefined,
  });
  if (error) return { ok: false, error: error.message };
  // E-posta doğrulaması açıksa oturum hemen oluşmaz
  return { ok: true, needsConfirm: !data.session };
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

/** Supabase hata mesajlarını sözlük anahtarlarına eşler; eşleşmeyen ham mesaj döner. */
export function mapAuthErrorKey(message: string): string | null {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "auth.error.invalidCredentials";
  if (m.includes("already registered") || m.includes("already exists"))
    return "auth.error.userExists";
  if (m.includes("password") && (m.includes("at least") || m.includes("short")))
    return "auth.error.shortPassword";
  if (m.includes("invalid email") || m.includes("valid email") || m.includes("invalid format"))
    return "auth.error.invalidEmail";
  return null;
}

export async function signInEmail(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "cloud-disabled" };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signUpPhone(
  phone: string,
  password: string,
): Promise<{ ok: boolean; needsConfirm?: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "cloud-disabled" };
  const { data, error } = await supabase.auth.signUp({ phone, password });
  if (error) return { ok: false, error: error.message };
  // SMS doğrulaması açıksa oturum hemen oluşmaz, kod girişi gerekir
  return { ok: true, needsConfirm: !data.session };
}

export async function signInPhone(
  phone: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "cloud-disabled" };
  const { error } = await supabase.auth.signInWithPassword({ phone, password });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Telefona gelen SMS kodunu doğrular; başarılıysa oturumu doğrudan açar. */
export async function verifyPhoneOtp(
  phone: string,
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "cloud-disabled" };
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signOutCloud(): Promise<void> {
  await supabase?.auth.signOut();
}

/** Kullanıcının kendi satırından şifreli vault'u çeker. */
export async function pullVaultData(): Promise<{ data: unknown; updatedAt: number } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("vaults")
    .select("data,updated_at")
    .single();
  if (error || !data) return null;
  return { data: data.data, updatedAt: new Date(data.updated_at).getTime() };
}

/** Vault verisini kullanıcının kendi satırına yazar (upsert). */
export async function pushVaultData(data: unknown): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("vaults").upsert({
    data,
    updated_at: new Date().toISOString(),
  });
  return !error;
}
