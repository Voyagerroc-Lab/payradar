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

// Tam sürüm pini: "@2" gibi gevşek aralık, her soğuk başlatmada o anki en
// yeni minörü çeker (tedarik zinciri riski + davranış kayması).
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

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

function attrsEmail(body: { data?: { attributes?: { user_email?: string | null } } }): string | null {
  const email = body.data?.attributes?.user_email;
  return typeof email === "string" && email.length > 0 ? email.toLowerCase() : null;
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
        user_email?: string | null;
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

  // Checkout'ta checkout[custom][user_id] olarak gönderilen Supabase kullanıcı id'si.
  // DİKKAT: bu alan checkout URL'sini kuran İSTEMCİDEN gelir; imza yalnızca
  // olayın Lemon Squeezy'den geldiğini kanıtlar, user_id'nin ödemeyi yapana
  // ait olduğunu KANITLAMAZ. Aşağıda biçim + hesap varlığı + abonelik
  // bağlama kontrolleriyle sınırlandırılır.
  const userId = body.meta?.custom_data?.user_id;
  if (!userId) return new Response("Missing custom user_id", { status: 200 });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return new Response("Invalid user_id", { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // --- Replay koruması: aynı olay ikinci kez işlenmez ---
  // X-Event-Id yoksa yedek kimliğe yükün hash'i de girer: aynı saniyede
  // (aynı updated_at ile) gelen iki FARKLI olay birbirini yutmasın.
  let eventId = req.headers.get("X-Event-Id");
  if (!eventId) {
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(payload));
    const hash = Array.from(new Uint8Array(digest).slice(0, 12))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    eventId = `${event}:${body.data?.id ?? "?"}:${hash}`;
  }
  const { error: dupErr } = await supabase
    .from("webhook_events")
    .insert({ event_id: eventId });
  if (dupErr) {
    // Birincil anahtar çakışması = bu olay daha önce işlendi
    return new Response("Duplicate ignored", { status: 200 });
  }

  // Eski replay kayıtlarını buda; tablo sınırsız büyümesin (pg_cron gerekmez)
  await supabase
    .from("webhook_events")
    .delete()
    .lt("received_at", new Date(Date.now() - 90 * 24 * 3600_000).toISOString());

  const attrs = body.data?.attributes ?? {};
  let status = attrs.status ?? "expired";
  // İade edilen abonelik premium sayılmaz
  if (isRefund) status = "expired";

  // Premium bitişi: iptal edilse bile ends_at'e kadar erişim sürer
  const periodEnd = isRefund
    ? new Date().toISOString()
    : (attrs.ends_at ?? attrs.renews_at ?? attrs.trial_ends_at ?? null);

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("trial_used,ls_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();

  // --- Hesap sahteciliği/griefing koruması ---
  // user_id'nin gerçekten var olan bir hesaba ait olduğunu doğrula: rastgele
  // UUID'lerle hayalet abonelik satırları yazılmasın.
  const { data: authUser, error: userErr } = await supabase.auth.admin.getUserById(userId);
  if (userErr || !authUser?.user) {
    return new Response("Unknown user_id", { status: 200 });
  }

  // Satın alanın e-postası hesap sahibiyle eşleşmeli: checkoutUrl() alanı
  // zaten hesabın e-postasıyla doldurur. Eşleşmeyen olay, custom_data'ya
  // başka birinin uid'ini yazan bir alışverişten geliyordur — işleme.
  // (LS bazı olaylarda user_email göndermeyebilir; alan yoksa atlanır.)
  const buyerEmail = attrsEmail(body);
  const accountEmail = authUser.user.email?.toLowerCase() ?? null;
  if (buyerEmail && accountEmail && buyerEmail !== accountEmail) {
    return new Response("Email mismatch ignored", { status: 200 });
  }

  // Satır zaten BAŞKA bir Lemon Squeezy aboneliğine bağlıysa, farklı bir
  // abonelikten gelen olay (özellikle iade/iptal) o satırı EZEMEZ. Aksi
  // hâlde saldırgan kendi 1$'lık aboneliğinin checkout'una kurbanın uid'ini
  // koyup iade isteyerek kurbanın premium/tanıtım hakkını söndürebilirdi.
  const incomingSubId = body.data?.id ?? null;
  if (
    existing?.ls_subscription_id &&
    incomingSubId &&
    existing.ls_subscription_id !== incomingSubId &&
    (isRefund || status === "expired" || status === "cancelled" || status === "paused")
  ) {
    return new Response("Subscription mismatch ignored", { status: 200 });
  }

  // --- Deneme suistimali: aynı hesap ikinci kez deneme başlatamaz ---
  if (status === "on_trial" && existing?.trial_used) {
    // Bu hesap denemesini kullanmış: ücretli değilse premium verme
    status = "expired";
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
