-- ============================================================
-- DuoLog — Supabase Schema (v2 — no categories)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Contributors
create table if not exists contributors (
  id   uuid primary key default gen_random_uuid(),
  name text not null
);

-- 2. Transactions (no category_id — description is the label)
create table if not exists transactions (
  id             uuid           primary key default gen_random_uuid(),
  type           text           not null check (type in ('INCOME', 'EXPENSE')),
  amount         numeric(14, 2) not null check (amount > 0),
  contributor_id uuid           not null references contributors(id) on delete restrict,
  description    text,
  date           timestamptz    not null default now()
);

-- ============================================================
-- Row Level Security
-- No auth — permissive anon policies. URL = shared secret.
-- ============================================================

alter table contributors enable row level security;
alter table transactions enable row level security;

create policy "anon_all_contributors" on contributors
  for all to anon using (true) with check (true);

create policy "anon_all_transactions" on transactions
  for all to anon using (true) with check (true);

-- ============================================================
-- Real-time replication
-- ============================================================
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table contributors;

-- ============================================================
-- Migration (if you already ran v1 with categories):
-- Run these lines instead of the full schema above.
-- ============================================================
-- alter table transactions drop column if exists category_id;
-- alter table transactions alter column contributor_id set not null;
-- drop table if exists categories;
