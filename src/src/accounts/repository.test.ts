import Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../db/migrator.js';
import { AccountValidationError, addAccount, listAccounts } from './repository.js';

let db: Database.Database;

beforeEach(() => {
  db = new Database(':memory:');
  runMigrations(db);
});

describe('addAccount', () => {
  it('creates the account and returns it with an id', () => {
    const account = addAccount(db, {
      name: 'Everyday Checking',
      type: 'checking',
      institution: 'First Bank',
      currency: 'USD',
    });

    expect(account.id).toBeGreaterThan(0);
    expect(account.name).toBe('Everyday Checking');
    expect(listAccounts(db)).toHaveLength(1);
  });

  it('rejects an invalid type and creates no account', () => {
    expect(() =>
      addAccount(db, {
        name: 'Mystery',
        type: 'crypto',
        institution: 'First Bank',
        currency: 'USD',
      }),
    ).toThrow(AccountValidationError);
    expect(listAccounts(db)).toHaveLength(0);
  });

  it.each(['name', 'type', 'institution', 'currency'] as const)(
    'rejects a missing %s and creates no account',
    (field) => {
      const input = {
        name: 'Everyday Checking',
        type: 'checking',
        institution: 'First Bank',
        currency: 'USD',
      };
      input[field] = '';

      expect(() => addAccount(db, input)).toThrow(AccountValidationError);
      expect(listAccounts(db)).toHaveLength(0);
    },
  );
});

describe('listAccounts', () => {
  it('returns an empty array when none are registered', () => {
    expect(listAccounts(db)).toEqual([]);
  });

  it('returns every registered account', () => {
    addAccount(db, { name: 'A', type: 'checking', institution: 'Bank', currency: 'USD' });
    addAccount(db, { name: 'B', type: 'savings', institution: 'Bank', currency: 'USD' });

    const accounts = listAccounts(db);
    expect(accounts.map((a) => a.name)).toEqual(['A', 'B']);
  });
});
