-- =============================================================
-- PayRadar — TEK SEFERDE KURULUM
-- Supabase Dashboard > SQL Editor > New query > yapıştır > Run
-- Tekrar çalıştırmak güvenlidir (idempotent).
-- =============================================================

-- Deneme/tanıtım suistimal koruması e-posta hash'i için gerekli
create extension if not exists pgcrypto;

-- -------------------------------------------------------------
-- 1) Kasa (bulut senkronu)
--    İçerik cihazda AES-256-GCM ile şifrelenip yazılır. NOT: anahtar
--    hesabın uid'inden türetildiği ve uid bu tablonun id sütununda
--    durduğu için bu, "sunucunun asla çözemeyeceği" uçtan uca şifreleme
--    DEĞİLDİR; tabloyu okuyabilen bir taraf anahtarı türetebilir.
--    Koruduğu şey: yalnızca şifreli bloğu (satırın kendisini değil)
--    ele geçiren taraflar ve kazara loglanan/dökümlenen içerik.
-- -------------------------------------------------------------
create table if not exists public.vaults (
  id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Tek satır MB'larca büyüyemesin (RLS satırı sahibine kilitler ama boyutu değil)
alter table public.vaults drop constraint if exists vaults_data_size;
alter table public.vaults
  add constraint vaults_data_size check (pg_column_size(data) < 1048576);

-- id varsayılanı olmadan istemcinin upsert'ü NOT NULL hatası verir
alter table public.vaults alter column id set default auth.uid();

alter table public.vaults enable row level security;

-- Kullanıcı SADECE kendi satırını görebilir/güncelleyebilir
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
-- 1b) Korumalı kasa yazımı (sunucu tarafı last-write-wins bekçisi)
--     İstemci saatine körü körüne güvenen upsert yerine: satır yalnızca
--     yeni zarfın updatedAt'i sunucudakinden ESKİ DEĞİLSE güncellenir.
--     Saati geri kalmış bir cihaz ya da yarışan iki push, daha yeni
--     veriyi sessizce ezemez. false dönerse istemci "eşitlenmedi" bilir.
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
    return false; -- sunucudaki daha yeni; ezme
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
--    Satırları YALNIZCA service-role (webhook) yazar.
-- -------------------------------------------------------------
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  -- on_trial | active | past_due | cancelled | expired
  status text not null default 'expired',
  current_period_end timestamptz,
  ls_customer_id text,
  ls_subscription_id text,
  -- Deneme suistimalini engeller: bu hesap denemesini kullandı mı?
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
-- 3) Webhook tekrar-gönderim (replay) koruması
--    Politika yok = yalnızca service-role erişir.
-- -------------------------------------------------------------
create table if not exists public.webhook_events (
  event_id text primary key,
  received_at timestamptz not null default now()
);
alter table public.webhook_events enable row level security;
-- Not: tablo sınırsız büyümesin diye ls-webhook fonksiyonu her çağrıda
-- 90 günden eski kayıtları siler; ayrıca pg_cron gerekmez.

-- -------------------------------------------------------------
-- 4) Premium yetki kontrolü (sunucu tarafı)
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
      -- Süresi geçmiş satır (kaçan webhook) premium saymaz
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

-- -------------------------------------------------------------
-- 5) Uygulama içi hesap silme (Google Play zorunluluğu)
--    Kullanıcı yalnızca KENDİ hesabını siler; auth.uid() dışına
--    çıkamaz. Edge Function gerektirmez.
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
-- 6) 6 AY ÜCRETSİZ KULLANIM (sunucu tarafında verilir)
--    Her hesap, kaydolduğu andan itibaren 6 ay boyunca Premium
--    sayılır. Süre dolunca abonelik ($1/ay) gerekir.
--    Not: Lemon Squeezy ürününde AYRICA deneme tanımlamayın —
--    ücretsiz dönem burada yönetiliyor.
-- -------------------------------------------------------------
-- Tanıtım dönemi hesap silme döngüsüyle sıfırlanamasın: hakkını kullanan
-- e-postanın tek yönlü hash'i tutulur (kişisel veri saklanmaz). Hesap
-- silinse ve aynı Google hesabıyla (yeni uid) tekrar açılsa da hash aynı
-- kalır ve ikinci bir 6 ay verilmez.
create table if not exists public.redeemed_intros (
  email_hash text primary key,
  redeemed_at timestamptz not null default now()
);
alter table public.redeemed_intros enable row level security;
-- Politika yok = yalnızca service-role / security definer fonksiyonlar erişir.

create or replace function public.grant_intro_period()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ehash text := encode(digest(lower(coalesce(new.email, new.id::text)), 'sha256'), 'hex');
begin
  -- Bu e-posta tanıtımını daha önce kullandıysa yeni hak verme
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

-- Mevcut hesapların hakları da kayda geçsin (yeniden kurulumda çifte hak yok)
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

-- Mevcut hesaplar da 6 ay alsın (kapı açıldığında kimse kilitlenmesin)
insert into public.subscriptions (user_id, status, current_period_end, trial_used)
select id, 'on_trial', now() + interval '6 months', true
from auth.users
on conflict (user_id) do nothing;
