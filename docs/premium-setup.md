# PayRadar Premium — Lemon Squeezy Kurulum Rehberi

Model: **Freemium** — yerel takip herkese süresiz ücretsiz; **bulut senkron + çok
cihaz erişimi** Premium (ilk ay ücretsiz deneme, sonra 1 $/ay). Satın alma
yalnızca web sitesinde yapılır (Spotify modeli); mobil uygulamada ödeme
görünmez, giriş yapan premium hakkını her cihazında kullanır.

Kod tarafı hazır. `VITE_LS_CHECKOUT_URL` tanımlanana kadar premium kapısı
**kapalıdır** (herkes premium sayılır, arayüzde satın alma görünmez) — yani bu
kurulum tamamlanmadan hiçbir kullanıcı kilitlenmez.

---

## 1) Supabase: abonelik tablosu (2 dk)

SQL Editor'de `supabase-setup.sql` dosyasının içeriğini çalıştırın (kasa + abonelik + webhook + hesap silme, hepsi tek dosyada):
https://supabase.com/dashboard/project/ejpokjesrvlgdqhmorfq/sql/new

## 2) Supabase: webhook fonksiyonu (5 dk)

1. Dashboard → **Edge Functions** → **Deploy a new function** (dashboard
   editörü) → isim: `ls-webhook`
2. Repodaki `supabase/functions/ls-webhook/index.ts` içeriğini yapıştırıp
   **Deploy** edin
3. Fonksiyon ayarlarında **"Verify JWT" seçeneğini KAPATIN** (webhook'u Lemon
   Squeezy çağıracak, Supabase oturumu olmayacak)
4. Fonksiyon URL'inizi not edin:
   `https://ejpokjesrvlgdqhmorfq.supabase.co/functions/v1/ls-webhook`

## 3) Lemon Squeezy hesabı ve ürün (10 dk)

1. https://lemonsqueezy.com → ücretsiz hesap + mağaza oluşturun (mağaza adı:
   PayRadar). Ödeme alabilmek için "Activate store" başvurusunu doldurun
   (onay birkaç gün sürebilir; test modunda beklemeden deneyebilirsiniz).
2. **Products → New product**:
   - Ad: `PayRadar Premium`
   - Pricing: **Subscription**, **$1 / month**
   - **Free trial: 30 days** (ilk ay ücretsiz)
3. Ürünü kaydedin → **Share** düğmesinden **checkout linkini** kopyalayın
   (`https://<mağaza>.lemonsqueezy.com/buy/<uuid>` biçiminde)

## 4) Lemon Squeezy webhook (3 dk)

1. **Settings → Webhooks → +**
2. Callback URL: 2. adımdaki fonksiyon URL'i
3. **Signing secret**: güçlü bir rastgele dize girin (not alın)
4. Events: `subscription_created`, `subscription_updated`,
   `subscription_cancelled`, `subscription_resumed`, `subscription_expired`,
   `subscription_paused`, `subscription_unpaused`
5. Supabase → Edge Functions → ls-webhook → **Secrets**:
   `LEMONSQUEEZY_WEBHOOK_SECRET` = aynı signing secret

## 5) Uygulamaya checkout linkini tanıt (Claude yapar)

3. adımdaki checkout linkini Claude'a verin; Vercel'e
`VITE_LS_CHECKOUT_URL` olarak eklenip yeniden deploy edilir. Bu andan
itibaren premium kapısı aktifleşir:

- Girişli ama aboneliksiz kullanıcı: senkron durur, profilde
  "Premium'a Geç — ilk ay ücretsiz, sonra $1/ay" butonu çıkar (yalnızca
  tarayıcıda; kurulu uygulamada buton gizlenir, politika gereği)
- Checkout, kullanıcının Supabase kimliğini `custom[user_id]` olarak taşır;
  webhook aboneliği doğru hesaba yazar
- Deneme dahil `on_trial`, `active`, `past_due` durumları ve dönemi bitmemiş
  `cancelled` premium sayılır

## 6) Test (LS test modunda)

1. LS panelinde sağ üstten **Test mode** açın; test kartı: `4242 4242 4242 4242`
2. Sitede bir hesapla giriş yapıp profildeki Premium butonuyla satın alın
3. Supabase → Table Editor → `subscriptions` satırının oluştuğunu görün
4. Profilde "Ücretsiz deneme 🎁" durumunun göründüğünü ve senkronun
   çalıştığını doğrulayın

## Notlar

- **Yıllık paket önerisi:** 1 $/ay'ın ~%35'i komisyona gider; LS'de aynı ürüne
  ikinci bir "yearly $10" varyantı ekleyip checkout'ta seçtirmek net geliri
  belirgin artırır.
- **Mevcut kullanıcılar:** Kapı aktifleşmeden önce senkron kullananlar da
  aboneliksizse kilitlenir; isterseniz LS panelinden onlara elle deneme
  tanımlayabilirsiniz.
- Sunucu tarafı sert kilit (RLS ile vaults erişimini aboneliğe bağlama)
  bilinçli olarak v1'e alınmadı; istenirse tek SQL politikasıyla eklenir.
