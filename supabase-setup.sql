-- PayRadar bulut senkronizasyonu için Supabase kurulumu
-- Supabase Dashboard > SQL Editor'e yapıştırıp çalıştır.

create table if not exists public.vaults (
  id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- id'nin varsayılanı olmadan client'taki upsert(id vermeden) NOT NULL hatası verir;
-- var olan kurulumlarda da geriye dönük uygulanabilsin diye ayrı bir ALTER olarak da çalıştırılıyor.
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
