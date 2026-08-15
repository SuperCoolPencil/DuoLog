-- DuoLog schema for Neon Postgres.
-- Run once in the Neon SQL Editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS contributors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  contributor_id uuid NOT NULL REFERENCES contributors(id) ON DELETE RESTRICT,
  description text,
  date timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions (date DESC);
