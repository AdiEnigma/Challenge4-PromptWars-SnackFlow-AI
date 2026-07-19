/**
 * SnackFlow AI - PostgreSQL migration runner
 * Applies versioned SQL migrations from postgres/migrations in filename order.
 * Tracks applied migrations in the `_migrations` table.
 *
 * Run: npm run migrate  (after building, or via ts-node)
 */
import fs from 'fs';
import path from 'path';
import { pool } from '../postgres/client';
import { logger } from '../logger';

const MIGRATIONS_DIR = path.join(__dirname, '..', 'postgres', 'migrations');

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

async function appliedMigrations(): Promise<Set<string>> {
  const { rows } = await pool.query<{ name: string }>('SELECT name FROM _migrations');
  return new Set(rows.map((r) => r.name));
}

export async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();
  const done = await appliedMigrations();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (done.has(file)) {
      logger.debug('migrate', `skip already applied: ${file}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    logger.info('migrate', `applying: ${file}`);
    await pool.query(sql);
    // If the migration did not self-record, record it here.
    await pool.query(
      'INSERT INTO _migrations (name, applied_at) VALUES ($1, NOW()) ON CONFLICT (name) DO NOTHING',
      [file],
    );
    logger.info('migrate', `applied: ${file}`);
  }
  logger.info('migrate', 'migrations complete');
}

if (require.main === module) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      logger.error('migrate', 'migration failed', err);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    });
}
