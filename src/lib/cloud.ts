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
  email: string;
}

export async function getCloudUser(): Promise<CloudUser | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.email ? { email: data.user.email } : null;
}

export async function signUpEmail(
  email: string,
  password: string,
): Promise<{ ok: boolean; needsConfirm?: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "cloud-disabled" };
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: error.message };
  // E-posta doğrulaması açıksa oturum hemen oluşmaz
  return { ok: true, needsConfirm: !data.session };
}

export async function signInEmail(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "cloud-disabled" };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
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
