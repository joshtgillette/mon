import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from './migrator.js';

let dir: string;
let db: Database.Database;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mon-migrator-'));
  db = new Database(':memory:');
});

afterEach(() => {
  db.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

function writeMigration(filename: string, sql: string): void {
  fs.writeFileSync(path.join(dir, filename), sql);
}

describe('runMigrations', () => {
  it('applies every migration to a fresh database, in order', () => {
    writeMigration('001_widgets.sql', 'CREATE TABLE widgets (id INTEGER PRIMARY KEY);');
    writeMigration('002_gadgets.sql', 'CREATE TABLE gadgets (id INTEGER PRIMARY KEY, widget_id INTEGER);');

    runMigrations(db, { migrationsDir: dir });

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => (row as { name: string }).name);
    expect(tables).toEqual(['gadgets', 'schema_migrations', 'widgets']);

    const applied = db
      .prepare('SELECT filename FROM schema_migrations ORDER BY filename')
      .all()
      .map((row) => (row as { filename: string }).filename);
    expect(applied).toEqual(['001_widgets.sql', '002_gadgets.sql']);
  });

  it('is a no-op on a database that already has every migration applied', () => {
    writeMigration('001_widgets.sql', 'CREATE TABLE widgets (id INTEGER PRIMARY KEY);');
    runMigrations(db, { migrationsDir: dir });

    db.prepare('INSERT INTO widgets (id) VALUES (1)').run();

    expect(() => runMigrations(db, { migrationsDir: dir })).not.toThrow();
    const rows = db.prepare('SELECT id FROM widgets').all();
    expect(rows).toEqual([{ id: 1 }]);
  });

  it('picks up a newly added migration on the next run, preserving prior data', () => {
    writeMigration('001_widgets.sql', 'CREATE TABLE widgets (id INTEGER PRIMARY KEY);');
    runMigrations(db, { migrationsDir: dir });
    db.prepare('INSERT INTO widgets (id) VALUES (1)').run();

    writeMigration('002_gadgets.sql', 'CREATE TABLE gadgets (id INTEGER PRIMARY KEY);');
    runMigrations(db, { migrationsDir: dir });

    const applied = db
      .prepare('SELECT filename FROM schema_migrations ORDER BY filename')
      .all()
      .map((row) => (row as { filename: string }).filename);
    expect(applied).toEqual(['001_widgets.sql', '002_gadgets.sql']);

    const widgetRows = db.prepare('SELECT id FROM widgets').all();
    expect(widgetRows).toEqual([{ id: 1 }]);
  });
});
