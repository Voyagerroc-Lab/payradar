// Lemon Squeezy webhook -> Supabase subscriptions tablosu
// Supabase Edge Function (Deno). Dashboard > Edge Functions > "ls-webhook"
// adıyla oluşturup bu dosyayı yapıştırın ve LEMONSQUEEZY_WEBHOOK_SECRET
// gizli değişkenini tanımlayın (Edge Functions > Secrets).
//
// Lemon Squeezy tarafında webhook URL'i:
//   https://<proje-ref>.supabase.co/functions/v1/ls-webhook
// Dinlenecek olaylar: subscription_created, subscription_updated,
// subscription_cancelled, subscription_resumed, subscription_expired,
// subscription_paused, subscription_unpaused,
// subscription_payment_refunded, order_refunded

import { createClient } from "npm:@supabase/supabase-js@2";

const encoder = new TextEncoder();

async function verifySignature(secret: string, payload: string, signature: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // sabit zamanlı karşılaştırma
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const secret = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET");
  if (!secret) return new Response("Webhook secret not configured", { status: 500 });

  const signature = req.headers.get("X-Signature") ?? "";
  const payload = await req.text();

  if (!(await verifySignature(secret, payload, signature))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let body: {
    meta?: { event_name?: string; custom_data?: { user_id?: string } };
    data?: {
      id?: string;
      attributes?: {
        status?: string;
        customer_id?: number;
        renews_at?: string | null;
        updated_at?: string | null;
        ends_at?: string | null;
        trial_ends_at?: string | null;
      };
    };
  };
  try {
    body = JSON.parse(payload);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const event = body.meta?.event_name ?? "";
  const isSubscription = event.startsWith("subscription_");
  const isRefund = event === "order_refunded" || event === "subscription_payment_refunded";
  if (!isSubscription && !isRefund) {
    return new Response("Ignored", { status: 200 });
  }

  // Checkout'ta checkout[custom][user_id] olarak gönderilen Supabase kullanıcı id'si
  const userId = body.meta?.custom_data?.user_id;
  if (!userId) return new Response("Missing custom user_id", { status: 200 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // --- Replay koruması: aynı olay ikinci kez işlenmez ---
  const eventId =
    req.headers.get("X-Event-Id") ??
    `${event}:${body.data?.id ?? "?"}:${body.data?.attributes?.updated_at ?? ""}`;
  const { error: dupErr } = await supabase
    .from("webhook_events")
    .insert({ event_id: eventId });
  if (dupErr) {
    // Birincil anahtar çakışması = bu olay daha önce işlendi
    return new Response("Duplicate ignored", { status: 200 });
  }

  const attrs = body.data?.attributes ?? {};
  let status = attrs.status ?? "expired";
  // İade edilen abonelik premium sayılmaz
  if (isRefund) status = "expired";

  // Premium bitişi: iptal edilse bile ends_at'e kadar erişim sürer
  const periodEnd = isRefund
    ? new Date().toISOString()
    : (attrs.ends_at ?? attrs.renews_at ?? attrs.trial_ends_at ?? null);

  // --- Deneme suistimali: aynı hesap ikinci kez deneme başlatamaz ---
  if (status === "on_trial") {
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("trial_used")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing?.trial_used) {
      // Bu hesap denemesini kullanmış: ücretli değilse premium verme
      status = "expired";
    }
  }

  const { error } = await supabase.from("subscriptions").upsert({
    user_id: userId,
    status,
    current_period_end: periodEnd,
    ls_customer_id: attrs.customer_id != null ? String(attrs.customer_id) : null,
    ls_subscription_id: body.data?.id ?? null,
    trial_used: status === "on_trial" ? true : undefined,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("subscriptions upsert failed:", error.message);
    return new Response("DB error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
});
