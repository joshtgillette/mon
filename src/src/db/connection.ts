import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { resolveDbPath } from './paths.js';
import { runMigrations } from './migrator.js';

/** Opens (creating if needed) the database at `dbPath`, running any pending migrations first. */
export function openDatabase(dbPath: string = resolveDbPath()): Database.Database {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  return db;
}
