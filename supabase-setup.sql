-- =============================================================
-- PayRadar — TEK SEFERDE KURULUM
-- Supabase Dashboard > SQL Editor > New query > yapıştır > Run
-- Tekrar çalıştırmak güvenlidir (idempotent).
-- =============================================================

-- -------------------------------------------------------------
-- 1) Kasa (bulut senkronu)
--    İçerik cihazda AES-256-GCM ile şifrelenip yazılır; sunucu
--    yalnızca şifreli bloğu görür.
-- -------------------------------------------------------------
create table if not exists public.vaults (
  id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

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
