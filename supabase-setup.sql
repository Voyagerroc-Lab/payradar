-- =============================================================
-- PayRadar — TEK SEFERDE KURULUM
-- Supabase Dashboard > SQL Editor > New query > yapıştır > Run
-- Tekrar çalıştırmak güvenlidir (idempotent).
-- =============================================================

-- Deneme/tanıtım kötüye kullanım koruması ve e-posta özeti (hash) için gerekli
create extension if not exists pgcrypto;

-- -------------------------------------------------------------
-- 1) Kasa (bulut senkronizasyonu)
--    İçerik cihazda AES-256-GCM ile şifrelenip yazılır. NOT: Anahtar,
--    hesabın UID değerinden türetildiği ve UID bu tablonun id sütununda
--    yer aldığı için bu, "sunucunun asla çözemeyeceği" uçtan uca şifreleme
--    DEĞİLDİR; tabloyu okuyabilen bir taraf anahtarı türetebilir.
--    Koruduğu durum: Yalnızca şifreli bloğu (satırın kendisini değil)
--    ele geçiren taraflar ve kazara günlüğe kaydedilen (loglanan) veya dökümü alınan içeriktir.
-- -------------------------------------------------------------
create table if not exists public.vaults (
  id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Tek satır megabaytlarca büyüyemesin (RLS satırı sahibine kilitler ancak boyutu sınırlandırmaz)
alter table public.vaults drop constraint if exists vaults_data_size;
alter table public.vaults
  add constraint vaults_data_size check (pg_column_size(data) < 1048576);

-- id için varsayılan değer atanmazsa istemcinin upsert işlemi NOT NULL hatası verir
alter table public.vaults alter column id set default auth.uid();

alter table public.vaults enable row level security;

-- Kullanıcı SADECE kendi satırını görebilir ve güncelleyebilir
drop policy if exists "own vault select" on public.vaults;
create policy "own vault select" on public.vaults
  for select using (auth.uid() = id);

drop policy if exists "own vault insert" on public.vaults;
create policy "own vault insert" on public.vaults
  for insert with check (auth.uid() = id);

drop policy if exists "own vault update" on public.vaults;
create policy "own vault update" on public.vaults
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own vault delete" on public.vaults;
create policy "own vault delete" on public.vaults
  for delete using (auth.uid() = id);

-- -------------------------------------------------------------
-- 1b) Korumalı kasa yazımı (sunucu tarafı son yazan kazanır / last-write-wins denetleyicisi)
--     İstemci saatine körü körüne güvenen upsert yerine: Satır yalnızca
--     yeni zarfın updatedAt değeri sunucudakinden ESKİ DEĞİLSE güncellenir.
--     Saati geri kalmış bir cihaz ya da eşzamanlı yarışan iki push işlemi, daha yeni
--     veriyi sessizce ezemez. false dönerse istemci verinin eşitlenmediğini anlar.
-- -------------------------------------------------------------
create or replace function public.push_vault(envelope jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_ts numeric := coalesce((envelope->>'updatedAt')::numeric, 0);
  cur_ts numeric;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select coalesce((data->>'updatedAt')::numeric, 0)
    into cur_ts
    from public.vaults where id = uid
    for update;

  if not found then
    insert into public.vaults (id, data, updated_at)
    values (uid, envelope, now());
    return true;
  end if;

  if new_ts < cur_ts then
    return false; -- Sunucudaki veri daha yeni; üzerine yazma
  end if;

  update public.vaults
     set data = envelope, updated_at = now()
   where id = uid;
  return true;
end;
$$;

revoke all on function public.push_vault(jsonb) from public, anon;
grant execute on function public.push_vault(jsonb) to authenticated;

-- -------------------------------------------------------------
-- 2) Abonelikler (Premium — Lemon Squeezy)
--    Satırları YALNIZCA service-role (webhook) yazabilir.
-- -------------------------------------------------------------
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  -- on_trial | active | past_due | cancelled | expired
  status text not null default 'expired',
  current_period_end timestamptz,
  ls_customer_id text,
  ls_subscription_id text,
  -- Deneme hakkının kötüye kullanımını engeller: Bu hesap deneme süresini kullandı mı?
  trial_used boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions
  add column if not exists trial_used boolean not null default false;

alter table public.subscriptions enable row level security;

drop policy if exists "own subscription select" on public.subscriptions;
create policy "own subscription select" on public.subscriptions
  for select using (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 3) Webhook tekrar gönderim (replay) koruması
--    Politika tanımlanmamıştır = Yalnızca service-role erişebilir.
-- -------------------------------------------------------------
create table if not exists public.webhook_events (
  event_id text primary key,
  received_at timestamptz not null default now()
);
alter table public.webhook_events enable row level security;
-- Not: Tablo sınırsız büyümesin diye ls-webhook fonksiyonu her çağrıda
-- 90 günden eski kayıtları temizler; bu nedenle ayrıca pg_cron gerekmez.

-- -------------------------------------------------------------
-- 4) Premium yetki denetimi (sunucu tarafı)
-- -------------------------------------------------------------
create or replace function public.is_entitled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = auth.uid()
      and (
        s.status in ('on_trial', 'active', 'past_due')
        or (s.status = 'cancelled' and s.current_period_end > now())
      )
      -- Süresi geçmiş satır (ulaşmayan/kaçan webhook) kullanıcıyı premium saymaz
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

-- -------------------------------------------------------------
-- 5) Uygulama içi hesap silme (Google Play zorunluluğu)
--    Kullanıcı yalnızca KENDİ hesabını silebilir; auth.uid() kapsamı dışına
--    çıkamaz. Ayrı bir Edge Function gerektirmez.
-- -------------------------------------------------------------
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  delete from public.vaults where id = uid;
  delete from public.subscriptions where user_id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

-- -------------------------------------------------------------
-- 6) 6 AY ÜCRETSİZ KULLANIM (sunucu tarafında tanımlanır)
--    Her hesap, kaydolduğu andan itibaren 6 ay boyunca Premium
--    sayılır. Süre dolunca abonelik ($1/ay) gereklidir.
--    Not: Lemon Squeezy ürününde AYRICA deneme süresi tanımlamayın;
--    ücretsiz deneme dönemi doğrudan burada yönetilmektedir.
-- -------------------------------------------------------------
-- Tanıtım dönemi hesap silme döngüsüyle sıfırlanamasın: Tanıtım hakkını kullanan
-- e-posta adresinin tek yönlü kriptografik özeti (hash) saklanır (kişisel veri tutulmaz).
-- Hesap silinip aynı Google hesabıyla (yeni bir UID ile) tekrar açılsa dahi özet aynı
-- kalacağından ikinci kez 6 aylık ücretsiz hak verilmez.
create table if not exists public.redeemed_intros (
  email_hash text primary key,
  redeemed_at timestamptz not null default now()
);
alter table public.redeemed_intros enable row level security;
-- Politika tanımlanmamıştır = Yalnızca service-role ve security definer fonksiyonlar erişebilir.

create or replace function public.grant_intro_period()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ehash text := encode(digest(lower(coalesce(new.email, new.id::text)), 'sha256'), 'hex');
begin
  -- Bu e-posta adresi tanıtım hakkını daha önce kullandıysa yeni hak tanımlama
  if exists (select 1 from public.redeemed_intros where email_hash = ehash) then
    return new;
  end if;

  insert into public.redeemed_intros (email_hash) values (ehash)
  on conflict (email_hash) do nothing;

  insert into public.subscriptions (user_id, status, current_period_end, trial_used)
  values (new.id, 'on_trial', now() + interval '6 months', true)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Mevcut hesapların hakları da kayda geçsin (yeniden kurulumda mükerrer hak tanınmasın)
insert into public.redeemed_intros (email_hash)
select encode(digest(lower(u.email), 'sha256'), 'hex')
from auth.users u
join public.subscriptions s on s.user_id = u.id
where u.email is not null and s.trial_used
on conflict (email_hash) do nothing;

drop trigger if exists on_auth_user_created_grant_intro on auth.users;
create trigger on_auth_user_created_grant_intro
  after insert on auth.users
  for each row execute function public.grant_intro_period();

-- Mevcut hesaplar da 6 ay ücretsiz kullanım alsın (özellik devreye girdiğinde mevcut kullanıcılar kilitlenmesin)
insert into public.subscriptions (user_id, status, current_period_end, trial_used)
select id, 'on_trial', now() + interval '6 months', true
from auth.users
on conflict (user_id) do nothing;
