import type { Command } from 'commander';
import type Database from 'better-sqlite3';
import { AccountValidationError, addAccount, listAccounts } from '../../accounts/repository.js';

export interface AccountCommandDeps {
  getDb: () => Database.Database;
  log: (line: string) => void;
}

interface AddAccountOptions {
  name?: string;
  type?: string;
  institution?: string;
  currency?: string;
}

export function registerAccountCommand(program: Command, deps: AccountCommandDeps): void {
  const account = program.command('account').description('Manage financial accounts');

  account
    .command('add')
    .description('Register a new account')
    .requiredOption('--name <name>', 'account name')
    .requiredOption('--type <type>', 'checking, savings, or credit')
    .requiredOption('--institution <institution>', 'institution label')
    .requiredOption('--currency <currency>', 'currency code (e.g. USD)')
    .action(function (this: Command, opts: AddAccountOptions) {
      try {
        const created = addAccount(deps.getDb(), {
          name: opts.name,
          type: opts.type,
          institution: opts.institution,
          currency: opts.currency,
        });
        deps.log(`Created account ${created.id}: ${created.name} (${created.type})`);
      } catch (err) {
        if (err instanceof AccountValidationError) {
          this.error(err.message, { exitCode: 1 });
        }
        throw err;
      }
    });

  account
    .command('list')
    .description('List registered accounts')
    .action(() => {
      const accounts = listAccounts(deps.getDb());
      if (accounts.length === 0) {
        deps.log('No accounts registered.');
        return;
      }
      for (const a of accounts) {
        deps.log(`${a.id}\t${a.name}\t${a.type}\t${a.institution}\t${a.currency}`);
      }
    });
}
