import type Database from 'better-sqlite3';
import { isAccountType, type Account, type NewAccount } from './types.js';

export class AccountValidationError extends Error {}

interface AccountRow {
  id: number;
  name: string;
  type: string;
  institution: string;
  currency: string;
  created_at: string;
}

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Account['type'],
    institution: row.institution,
    currency: row.currency,
    createdAt: row.created_at,
  };
}

function requireField(input: NewAccount, field: keyof NewAccount): void {
  if (!input[field]) {
    throw new AccountValidationError(`${field} is required`);
  }
}

export function addAccount(db: Database.Database, input: NewAccount): Account {
  requireField(input, 'name');
  requireField(input, 'type');
  requireField(input, 'institution');
  requireField(input, 'currency');
  const { name, type, institution, currency } = input as {
    [K in keyof NewAccount]: string;
  };
  if (!isAccountType(type)) {
    throw new AccountValidationError(
      `type must be one of ${['checking', 'savings', 'credit'].join(', ')} — got "${type}"`,
    );
  }

  const result = db
    .prepare('INSERT INTO accounts (name, type, institution, currency) VALUES (?, ?, ?, ?)')
    .run(name, type, institution, currency);

  const row = db
    .prepare('SELECT * FROM accounts WHERE id = ?')
    .get(result.lastInsertRowid) as AccountRow;
  return toAccount(row);
}

export function listAccounts(db: Database.Database): Account[] {
  const rows = db.prepare('SELECT * FROM accounts ORDER BY id').all() as AccountRow[];
  return rows.map(toAccount);
}
