-- PayRadar Premium abonelik altyapısı (Lemon Squeezy)
-- Supabase Dashboard > SQL Editor'e yapıştırıp çalıştır.

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  -- on_trial | active | past_due | cancelled | expired
  status text not null default 'expired',
  -- abonelik/deneme bitiş anı; bu tarihe kadar premium sayılır
  current_period_end timestamptz,
  ls_customer_id text,
  ls_subscription_id text,
  -- Deneme suistimalini engellemek için: bu hesap daha önce deneme kullandı mı?
  trial_used boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions
  add column if not exists trial_used boolean not null default false;

alter table public.subscriptions enable row level security;

-- Kullanıcı yalnızca KENDİ abonelik durumunu OKUYABİLİR.
-- Yazma politikası yok: satırlar yalnızca service-role (webhook) ile yazılır.
drop policy if exists "own subscription select" on public.subscriptions;
create policy "own subscription select" on public.subscriptions
  for select using (auth.uid() = user_id);

-- İşlenen webhook olaylarını kaydeder; tekrar gönderim (replay) reddedilir.
create table if not exists public.webhook_events (
  event_id text primary key,
  received_at timestamptz not null default now()
);
alter table public.webhook_events enable row level security;
-- Politika yok = yalnızca service-role erişebilir.

-- ---------------------------------------------------------------------------
-- SUNUCU TARAFI PREMIUM ZORLAMASI
-- Premium kapısı istemcide değil, burada karar verilir. Tarayıcıdan doğrudan
-- API çağrısı yapan biri bile abonelik satırı olmadan vault'a yazamaz/okuyamaz.
-- ---------------------------------------------------------------------------
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

-- NOT: Aşağıdaki politikalar premium kapısını SUNUCUDA açar.
-- Ücretsiz senkron dönemi bitene kadar çalıştırmayın; hazır olduğunuzda
-- bu bloğu tek başına çalıştırmanız yeterlidir.
--
-- drop policy if exists "own vault select" on public.vaults;
-- create policy "own vault select" on public.vaults
--   for select using (auth.uid() = id and public.is_entitled());
--
-- drop policy if exists "own vault insert" on public.vaults;
-- create policy "own vault insert" on public.vaults
--   for insert with check (auth.uid() = id and public.is_entitled());
--
-- drop policy if exists "own vault update" on public.vaults;
-- create policy "own vault update" on public.vaults
--   for update using (auth.uid() = id and public.is_entitled())
--   with check (auth.uid() = id and public.is_entitled());
