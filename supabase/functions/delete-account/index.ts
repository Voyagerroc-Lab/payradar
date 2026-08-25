// Uygulama içi hesap silme (Google Play "hesap silme" politikası gereği).
// Supabase Edge Function: Dashboard > Edge Functions > "delete-account".
// "Verify JWT" AÇIK bırakılabilir; fonksiyon zaten token'ı kendisi doğrular.
//
// Çağrı: POST https://<ref>.supabase.co/functions/v1/delete-account
//        Authorization: Bearer <kullanıcının access_token'ı>

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return new Response("Missing token", { status: 401, headers: CORS });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Token'ı doğrula: yalnızca kendi hesabını silebilir
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const uid = userData?.user?.id;
  if (userErr || !uid) {
    return new Response("Invalid token", { status: 401, headers: CORS });
  }

  // Önce veriler, sonra kimlik (FK cascade zaten var; yine de açıkça temizliyoruz)
  await admin.from("vaults").delete().eq("id", uid);
  await admin.from("subscriptions").delete().eq("user_id", uid);

  const { error: delErr } = await admin.auth.admin.deleteUser(uid);
  if (delErr) {
    console.error("deleteUser failed:", delErr.message);
    return new Response("Delete failed", { status: 500, headers: CORS });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
