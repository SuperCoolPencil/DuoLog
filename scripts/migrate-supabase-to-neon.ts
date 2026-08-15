import { neon } from '@neondatabase/serverless';

type Contributor = { id: string; name: string };
type Transaction = {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string | number;
  contributor_id: string;
  description: string | null;
  date: string;
};

const databaseUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!databaseUrl || !supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Set DATABASE_URL, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY in .env.local before migrating.',
  );
}

const supabaseHeaders: Record<string, string> = {
  apikey: supabaseServiceRoleKey,
  Authorization: `Bearer ${supabaseServiceRoleKey}`,
};

async function fetchAll<T>(table: 'contributors' | 'transactions'): Promise<T[]> {
  const records: T[] = [];
  const pageSize = 1_000;

  for (let offset = 0; ; offset += pageSize) {
    const url = new URL(`/rest/v1/${table}`, supabaseUrl);
    url.searchParams.set('select', '*');
    url.searchParams.set('order', 'id.asc');
    url.searchParams.set('limit', String(pageSize));
    url.searchParams.set('offset', String(offset));

    const response = await fetch(url, {
      headers: supabaseHeaders,
    });
    if (!response.ok) throw new Error(`Could not read Supabase ${table}: ${await response.text()}`);

    const page = (await response.json()) as T[];
    records.push(...page);
    if (page.length < pageSize) return records;
  }
}

const contributors = await fetchAll<Contributor>('contributors');
const transactions = await fetchAll<Transaction>('transactions');
const sql = neon(databaseUrl);

await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
await sql`
  CREATE TABLE IF NOT EXISTS contributors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL
  )
`;
await sql`
  CREATE TABLE IF NOT EXISTS transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    amount numeric(14, 2) NOT NULL CHECK (amount > 0),
    contributor_id uuid NOT NULL REFERENCES contributors(id) ON DELETE RESTRICT,
    description text,
    date timestamptz NOT NULL DEFAULT now()
  )
`;
await sql`CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions (date DESC)`;

for (const contributor of contributors) {
  await sql`
    INSERT INTO contributors (id, name)
    VALUES (${contributor.id}, ${contributor.name})
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
  `;
}

for (const transaction of transactions) {
  await sql`
    INSERT INTO transactions (id, type, amount, contributor_id, description, date)
    VALUES (
      ${transaction.id}, ${transaction.type}, ${transaction.amount},
      ${transaction.contributor_id}, ${transaction.description}, ${transaction.date}
    )
    ON CONFLICT (id) DO UPDATE SET
      type = EXCLUDED.type,
      amount = EXCLUDED.amount,
      contributor_id = EXCLUDED.contributor_id,
      description = EXCLUDED.description,
      date = EXCLUDED.date
  `;
}

console.log(`Migrated ${contributors.length} contributors and ${transactions.length} transactions to Neon.`);
