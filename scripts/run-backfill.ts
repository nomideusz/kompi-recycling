/**
 * One-off: apply drizzle/backfill_takeback_type.sql to the configured Turso DB.
 *
 *   pnpm tsx scripts/run-backfill.ts
 *
 * Reads TURSO_DATABASE_URL + TURSO_AUTH_TOKEN from .env, runs each UPDATE in
 * the SQL file, and reports rows affected so you can sanity-check the spread.
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient } from '@libsql/client';

const here = dirname(fileURLToPath(import.meta.url));
const sqlPath = resolve(here, '..', 'drizzle', 'backfill_takeback_type.sql');

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error('TURSO_DATABASE_URL is not set');
  process.exit(1);
}

const raw = readFileSync(sqlPath, 'utf8');
const statements = raw
  .split('\n')
  .map((line) => (line.match(/^\s*--/) ? '' : line))
  .join('\n')
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

const client = createClient({ url, authToken });

const before = await client.execute(
  `SELECT takeback_type, COUNT(*) AS n FROM recycling_points GROUP BY takeback_type ORDER BY n DESC`,
);
console.log('Before:');
for (const row of before.rows) console.log(`  ${row.takeback_type}: ${row.n}`);

let total = 0;
for (const sql of statements) {
  const rs = await client.execute(sql);
  total += rs.rowsAffected ?? 0;
  console.log(`  rowsAffected=${rs.rowsAffected ?? 0}  -- ${sql.slice(0, 60).replace(/\s+/g, ' ')}…`);
}

const after = await client.execute(
  `SELECT takeback_type, COUNT(*) AS n FROM recycling_points GROUP BY takeback_type ORDER BY n DESC`,
);
console.log(`\nAfter (total updates: ${total}):`);
for (const row of after.rows) console.log(`  ${row.takeback_type}: ${row.n}`);

await client.close();
