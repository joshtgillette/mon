import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type Database from 'better-sqlite3';

const DEFAULT_MIGRATIONS_DIR = fileURLToPath(new URL('./migrations', import.meta.url));

export interface RunMigrationsOptions {
  /** Overridable for tests; defaults to the migrations shipped alongside this module. */
  migrationsDir?: string;
}

interface SchemaMigrationRow {
  filename: string;
}

function migrationFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort();
}

/** Applies pending migrations in filename order, each in its own transaction, at most once. */
export function runMigrations(db: Database.Database, options: RunMigrationsOptions = {}): void {
  const dir = options.migrationsDir ?? DEFAULT_MIGRATIONS_DIR;

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  const applied = new Set(
    (db.prepare('SELECT filename FROM schema_migrations').all() as SchemaMigrationRow[]).map(
      (row) => row.filename,
    ),
  );

  for (const file of migrationFiles(dir)) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    const applyMigration = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (filename) VALUES (?)').run(file);
    });
    applyMigration();
  }
}
