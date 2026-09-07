import Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../db/migrator.js';
import { listAccounts } from '../accounts/repository.js';
import { createProgram } from './program.js';

interface CommanderErrorLike {
  exitCode: number;
}

function isCommanderErrorLike(err: unknown): err is CommanderErrorLike {
  return typeof err === 'object' && err !== null && 'exitCode' in err;
}

let db: Database.Database;
let out: string[];
let errOut: string[];

beforeEach(() => {
  db = new Database(':memory:');
  runMigrations(db);
  out = [];
  errOut = [];
});

function program() {
  return createProgram({
    getDb: () => db,
    stdout: (s) => out.push(s),
    stderr: (s) => errOut.push(s),
  });
}

async function run(args: string[]): Promise<number> {
  try {
    await program().parseAsync(args, { from: 'user' });
    return 0;
  } catch (err) {
    if (isCommanderErrorLike(err)) return err.exitCode;
    throw err;
  }
}

describe('mon --help', () => {
  it('lists the account subcommand group', async () => {
    const exitCode = await run(['--help']);
    expect(exitCode).toBe(0);
    expect(out.join('')).toMatch(/account/);
  });
});

describe('unknown command', () => {
  it('is rejected with a clear error and a non-zero exit code', async () => {
    const exitCode = await run(['bogus']);
    expect(exitCode).not.toBe(0);
    expect(errOut.join('')).toMatch(/unknown command/i);
  });
});

describe('mon account add', () => {
  it('creates the account and prints confirmation including its id', async () => {
    const exitCode = await run([
      'account',
      'add',
      '--name',
      'Everyday Checking',
      '--type',
      'checking',
      '--institution',
      'First Bank',
      '--currency',
      'USD',
    ]);
    expect(exitCode).toBe(0);
    expect(out.join('')).toMatch(/Created account \d+/);
    expect(listAccounts(db)).toHaveLength(1);
  });

  it('rejects an invalid type, exits non-zero, and creates no account', async () => {
    const exitCode = await run([
      'account',
      'add',
      '--name',
      'Mystery',
      '--type',
      'crypto',
      '--institution',
      'First Bank',
      '--currency',
      'USD',
    ]);
    expect(exitCode).not.toBe(0);
    expect(listAccounts(db)).toHaveLength(0);
  });

  it('rejects a missing required field, exits non-zero, and creates no account', async () => {
    const exitCode = await run([
      'account',
      'add',
      '--type',
      'checking',
      '--institution',
      'First Bank',
      '--currency',
      'USD',
    ]);
    expect(exitCode).not.toBe(0);
    expect(listAccounts(db)).toHaveLength(0);
  });
});

describe('mon account list', () => {
  it('prints each account with name, type, institution, and currency', async () => {
    await run([
      'account',
      'add',
      '--name',
      'Everyday Checking',
      '--type',
      'checking',
      '--institution',
      'First Bank',
      '--currency',
      'USD',
    ]);
    out = [];

    const exitCode = await run(['account', 'list']);
    expect(exitCode).toBe(0);
    const printed = out.join('');
    expect(printed).toMatch(/Everyday Checking/);
    expect(printed).toMatch(/checking/);
    expect(printed).toMatch(/First Bank/);
    expect(printed).toMatch(/USD/);
  });

  it('prints an explicit empty-state message when no accounts are registered', async () => {
    const exitCode = await run(['account', 'list']);
    expect(exitCode).toBe(0);
    expect(out.join('')).toMatch(/no accounts/i);
  });
});
