import { supabase } from "./cloud";
import type { CloudUser } from "./cloud";

/**
 * Premium (Lemon Squeezy) katmanı.
 *
 * VITE_LS_CHECKOUT_URL tanımlı değilse premium kapısı tamamen KAPALIDIR:
 * herkes premium sayılır ve arayüzde satın alma görünmez. Lemon Squeezy
 * mağazası kurulup checkout linki env'e eklendiğinde kapı aktifleşir.
 */

const checkoutBase = import.meta.env.VITE_LS_CHECKOUT_URL as string | undefined;

/** Premium kapısı aktif mi? (checkout linki yapılandırılmışsa) */
export const premiumGateEnabled = Boolean(checkoutBase);

export type SubscriptionStatus =
  | "on_trial"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired"
  | "none";

export interface Subscription {
  status: SubscriptionStatus;
  /** Bu tarihe kadar premium erişim geçerli (iptal edilmiş olsa bile) */
  currentPeriodEnd: number | null;
}

/** Kullanıcının abonelik satırını okur; satır yoksa "none" döner. */
export async function getSubscription(): Promise<Subscription> {
  if (!supabase) return { status: "none", currentPeriodEnd: null };
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status,current_period_end")
    .maybeSingle();
  if (error || !data) return { status: "none", currentPeriodEnd: null };
  return {
    status: (data.status as SubscriptionStatus) ?? "none",
    currentPeriodEnd: data.current_period_end
      ? new Date(data.current_period_end).getTime()
      : null,
  };
}

/** Deneme dahil, dönem sonu geçmemiş her abonelik premium sayılır. */
export function isEntitled(sub: Subscription): boolean {
  if (!premiumGateEnabled) return true;
  if (sub.status === "on_trial" || sub.status === "active" || sub.status === "past_due")
    return true;
  // İptal edilmiş ama dönemi bitmemişse erişim sürer
  if (sub.status === "cancelled" && sub.currentPeriodEnd && sub.currentPeriodEnd > Date.now())
    return true;
  return false;
}

/**
 * Lemon Squeezy checkout linki: kullanıcı kimliği custom veri olarak eklenir
 * ki webhook aboneliği doğru Supabase hesabına bağlayabilsin.
 */
export function checkoutUrl(user: CloudUser): string | null {
  if (!checkoutBase || !user.uid) return null;
  const sep = checkoutBase.includes("?") ? "&" : "?";
  const email = user.email ? `&checkout[email]=${encodeURIComponent(user.email)}` : "";
  return `${checkoutBase}${sep}checkout[custom][user_id]=${encodeURIComponent(user.uid)}${email}`;
}

/**
 * Ödeme bağlantısı yalnızca normal tarayıcı sekmesinde gösterilir.
 * Kurulu uygulamada (TWA/PWA standalone) gösterilmez — mağaza politikaları
 * uygulama içinden harici ödeme yönlendirmesine izin vermez.
 */
export function canShowCheckout(): boolean {
  if (!premiumGateEnabled) return false;
  return !window.matchMedia("(display-mode: standalone)").matches;
}
