import { Command } from 'commander';
import type Database from 'better-sqlite3';
import { registerAccountCommand } from './commands/account.js';

export interface ProgramDeps {
  getDb: () => Database.Database;
  stdout: (line: string) => void;
  stderr: (str: string) => void;
}

/**
 * Builds the `mon` command tree. `exitOverride` + `configureOutput` make the
 * program safe to drive in tests: commander throws `CommanderError` instead
 * of calling `process.exit`, and writes go through the given callbacks
 * instead of directly to the real stdout/stderr.
 */
export function createProgram(deps: ProgramDeps): Command {
  const program = new Command();
  program
    .name('mon')
    .description('Personal finance CLI')
    .exitOverride()
    .configureOutput({
      writeOut: (str) => deps.stdout(str),
      writeErr: (str) => deps.stderr(str),
    });

  registerAccountCommand(program, {
    getDb: deps.getDb,
    log: (line) => deps.stdout(`${line}\n`),
  });

  return program;
}
