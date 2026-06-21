-- ============================================================
-- DuoLog — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Contributors
create table if not exists contributors (
  id   uuid primary key default gen_random_uuid(),
  name text not null
);

-- 2. Categories
create table if not exists categories (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('INCOME', 'EXPENSE'))
);

-- 3. Transactions
create table if not exists transactions (
  id             uuid        primary key default gen_random_uuid(),
  type           text        not null check (type in ('INCOME', 'EXPENSE')),
  amount         numeric(14, 2) not null check (amount > 0),
  category_id    uuid        references categories(id) on delete set null,
  contributor_id uuid        references contributors(id) on delete set null,
  description    text,
  date           timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- Since this app has NO auth, we enable RLS but allow all
-- operations for the anon role. The URL is the shared secret.
-- ============================================================

alter table contributors enable row level security;
alter table categories   enable row level security;
alter table transactions enable row level security;

create policy "anon_all_contributors" on contributors
  for all to anon using (true) with check (true);

create policy "anon_all_categories" on categories
  for all to anon using (true) with check (true);

create policy "anon_all_transactions" on transactions
  for all to anon using (true) with check (true);

-- ============================================================
-- Real-time — enable publication for transactions table
-- ============================================================
alter publication supabase_realtime add table transactions;

-- ============================================================
-- Optional: also subscribe to contributors & categories
-- for Settings real-time sync (useful if both users are in
-- Settings at the same time)
-- ============================================================
alter publication supabase_realtime add table contributors;
alter publication supabase_realtime add table categories;
