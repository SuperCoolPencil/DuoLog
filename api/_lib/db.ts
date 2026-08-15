import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL environment variable.');
}

export const sql = neon(databaseUrl);

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function error(message: string, status = 400) {
  return json({ error: message }, status);
}
