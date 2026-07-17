/**
 * Apply a SQL backfill from drizzle/ to the configured Turso DB.
 *
 *   pnpm tsx scripts/run-backfill.ts [backfill_file.sql]
 *
 * Defaults to backfill_takeback_type.sql. Reads TURSO_DATABASE_URL +
 * TURSO_AUTH_TOKEN from .env, runs each UPDATE, and reports rows affected.
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient } from '@libsql/client';

const here = dirname(fileURLToPath(import.meta.url));
const sqlFile = process.argv[2] ?? 'backfill_takeback_type.sql';
const sqlPath = resolve(here, '..', 'drizzle', sqlFile);

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

const summarize = async (label: string) => {
  const rs = await client.execute(
    `SELECT takeback_type, COUNT(*) AS n, SUM(length(categories_json) - length(replace(categories_json, ',', ''))) + COUNT(*) AS cat_entries FROM recycling_points GROUP BY takeback_type ORDER BY n DESC`,
  );
  console.log(label);
  for (const row of rs.rows) console.log(`  ${row.takeback_type}: ${row.n} rows, ${row.cat_entries} category entries`);
};
await summarize('Before:');

let total = 0;
for (const sql of statements) {
  const rs = await client.execute(sql);
  total += rs.rowsAffected ?? 0;
  console.log(`  rowsAffected=${rs.rowsAffected ?? 0}  -- ${sql.slice(0, 60).replace(/\s+/g, ' ')}…`);
}

await summarize(`\nAfter (total updates: ${total}):`);

await client.close();
