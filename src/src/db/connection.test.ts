import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase } from './connection.js';

let dir: string;

afterEach(() => {
  if (dir) fs.rmSync(dir, { recursive: true, force: true });
});

describe('openDatabase', () => {
  it('creates the database file (and its parent directory) at the given path and runs migrations', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mon-connection-'));
    const dbPath = path.join(dir, 'nested', 'mon.db');

    const db = openDatabase(dbPath);
    try {
      expect(fs.existsSync(dbPath)).toBe(true);
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
        .all()
        .map((row) => (row as { name: string }).name)
        .filter((name) => !name.startsWith('sqlite_'));
      expect(tables).toEqual(['accounts', 'schema_migrations', 'transactions']);
    } finally {
      db.close();
    }
  });
});
