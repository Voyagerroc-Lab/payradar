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
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Kullanıcı yalnızca KENDİ abonelik durumunu OKUYABİLİR.
-- Yazma politikası yok: satırlar yalnızca service-role (webhook) ile yazılır.
drop policy if exists "own subscription select" on public.subscriptions;
create policy "own subscription select" on public.subscriptions
  for select using (auth.uid() = user_id);
