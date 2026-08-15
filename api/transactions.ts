import { error, json, sql } from './_lib/db';

const selectTransactions = sql`
  SELECT t.id, t.type, t.amount, t.contributor_id, t.description, t.date,
    json_build_object('name', c.name) AS contributors
  FROM transactions t
  LEFT JOIN contributors c ON c.id = t.contributor_id
  ORDER BY t.date DESC
`;

export default async function handler(request: Request) {
  if (request.method === 'GET') return json(await selectTransactions);

  if (request.method === 'POST') {
    const { type, amount, contributor_id: contributorId, description, date } = await request.json();
    if ((type !== 'INCOME' && type !== 'EXPENSE') || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return error('A valid transaction type and positive amount are required.');
    }
    if (typeof contributorId !== 'string' || typeof date !== 'string') {
      return error('A contributor and date are required.');
    }

    const transactions = await sql`
      WITH inserted AS (
        INSERT INTO transactions (type, amount, contributor_id, description, date)
        VALUES (${type}, ${amount}, ${contributorId}, ${typeof description === 'string' ? description : ''}, ${date})
        RETURNING id, type, amount, contributor_id, description, date
      )
      SELECT i.id, i.type, i.amount, i.contributor_id, i.description, i.date,
        json_build_object('name', c.name) AS contributors
      FROM inserted i
      JOIN contributors c ON c.id = i.contributor_id
    `;
    return json(transactions[0], 201);
  }

  if (request.method === 'DELETE') {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return error('A transaction id is required.');

    const transactions = await sql`DELETE FROM transactions WHERE id = ${id} RETURNING id`;
    return transactions.length ? new Response(null, { status: 204 }) : error('Transaction not found.', 404);
  }

  return error('Method not allowed.', 405);
}
