#!/usr/bin/env node
import { openDatabase } from '../db/connection.js';
import { createProgram } from './program.js';

let db: import('better-sqlite3').Database | undefined;

const program = createProgram({
  getDb: () => (db ??= openDatabase()),
  stdout: (str) => process.stdout.write(str),
  stderr: (str) => process.stderr.write(str),
});

try {
  await program.parseAsync(process.argv);
} catch (err) {
  const exitCode =
    typeof err === 'object' && err !== null && 'exitCode' in err
      ? Number((err as { exitCode: unknown }).exitCode)
      : 1;
  process.exitCode = Number.isInteger(exitCode) ? exitCode : 1;
} finally {
  db?.close();
}
