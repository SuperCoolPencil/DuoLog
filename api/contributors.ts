import { error, json, sql } from './_lib/db.js';

async function handler(request: Request) {
  if (request.method === 'GET') {
    const contributors = await sql`SELECT id, name FROM contributors ORDER BY name`;
    return json(contributors);
  }

  if (request.method === 'POST') {
    const { name } = await request.json();
    if (typeof name !== 'string' || !name.trim()) return error('A contributor name is required.');

    const [contributor] = await sql`
      INSERT INTO contributors (name) VALUES (${name.trim()}) RETURNING id, name
    `;
    return json(contributor, 201);
  }

  if (request.method === 'PATCH') {
    const { id, name } = await request.json();
    if (typeof id !== 'string' || typeof name !== 'string' || !name.trim()) {
      return error('A contributor id and name are required.');
    }

    const [contributor] = await sql`
      UPDATE contributors SET name = ${name.trim()} WHERE id = ${id} RETURNING id, name
    `;
    return contributor ? json(contributor) : error('Contributor not found.', 404);
  }

  if (request.method === 'DELETE') {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return error('A contributor id is required.');

    try {
      const contributors = await sql`DELETE FROM contributors WHERE id = ${id} RETURNING id`;
      return contributors.length ? new Response(null, { status: 204 }) : error('Contributor not found.', 404);
    } catch (cause) {
      if (typeof cause === 'object' && cause && 'code' in cause && cause.code === '23503') {
        return error('A contributor with transactions cannot be deleted.', 409);
      }
      throw cause;
    }
  }

  return error('Method not allowed.', 405);
}

export default { fetch: handler };
