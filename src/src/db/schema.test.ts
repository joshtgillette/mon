import Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from './migrator.js';

let db: Database.Database;

beforeEach(() => {
  db = new Database(':memory:');
  runMigrations(db);
});

describe('accounts schema', () => {
  it('stores a valid type with a creation timestamp', () => {
    db.prepare(
      'INSERT INTO accounts (name, type, institution, currency) VALUES (?, ?, ?, ?)',
    ).run('Checking', 'checking', 'Bank', 'USD');

    const row = db.prepare('SELECT * FROM accounts').get() as {
      type: string;
      created_at: string;
    };
    expect(row.type).toBe('checking');
    expect(row.created_at).toBeTruthy();
  });

  it('rejects an invalid type and creates no row', () => {
    expect(() =>
      db
        .prepare('INSERT INTO accounts (name, type, institution, currency) VALUES (?, ?, ?, ?)')
        .run('Checking', 'crypto', 'Bank', 'USD'),
    ).toThrow();

    const count = (db.prepare('SELECT COUNT(*) AS c FROM accounts').get() as { c: number }).c;
    expect(count).toBe(0);
  });
});

describe('transactions schema', () => {
  function insertAccount(): number {
    const result = db
      .prepare('INSERT INTO accounts (name, type, institution, currency) VALUES (?, ?, ?, ?)')
      .run('Checking', 'checking', 'Bank', 'USD');
    return Number(result.lastInsertRowid);
  }

  it('stores an integer amount and retains the raw source row as JSON', () => {
    const accountId = insertAccount();
    const raw = { description: 'Coffee', amount: '-4.50' };

    db.prepare(
      `INSERT INTO transactions
        (account_id, posted_date, amount_minor_units, currency, description, raw_source_row)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(accountId, '2026-09-01', -450, 'USD', 'Coffee', JSON.stringify(raw));

    const row = db.prepare('SELECT * FROM transactions').get() as {
      amount_minor_units: number;
      raw_source_row: string;
    };
    expect(Number.isInteger(row.amount_minor_units)).toBe(true);
    expect(row.amount_minor_units).toBe(-450);
    expect(JSON.parse(row.raw_source_row)).toEqual(raw);
  });

  it('can be created with import_batch_id unset', () => {
    const accountId = insertAccount();

    db.prepare(
      `INSERT INTO transactions
        (account_id, posted_date, amount_minor_units, currency, description, raw_source_row)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(accountId, '2026-09-01', -450, 'USD', 'Coffee', '{}');

    const row = db.prepare('SELECT import_batch_id FROM transactions').get() as {
      import_batch_id: number | null;
    };
    expect(row.import_batch_id).toBeNull();
  });
});
