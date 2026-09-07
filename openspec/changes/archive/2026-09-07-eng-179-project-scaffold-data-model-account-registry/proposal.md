## Why

`mon` doesn't exist as a project yet — there's no `src/`, no database, no CLI. Every later task in the CSV-import epic (parsing, per-institution mapping, dedup) needs a place to write transactions and an account to write them against. This task lays that foundation: the Node/TypeScript project, the `mon` CLI entrypoint, the SQLite database with a migration mechanism, and the `accounts`/`transactions` schema, plus the first real CLI feature (`mon account add` / `mon account list`) to prove the whole stack end to end.

## What Changes

- New TypeScript/Node project under `src/`: package config, test runner (vitest), lint/format, build.
- `mon` CLI entrypoint with subcommand-group structure (`account` today; `import`, `tag` later), built on `commander`.
- SQLite database via `better-sqlite3`, opened at a per-user default path, overridable by an env var (for tests and alternate profiles).
- A plain-SQL, ordered-file migration mechanism that runs on CLI startup.
- `accounts` table: id, name, type (`checking` | `savings` | `credit`), institution label, currency, created timestamp.
- `transactions` table: id, account FK, posted date, amount in integer minor units, currency, description, raw source row (JSON), nullable import-batch FK (column reserved; `import_batches` itself is out of scope), created timestamp.
- A branded `Cents` money type documented in `src/AGENTS.md`, establishing integer-minor-units as the only representation of money in this codebase.
- `mon account add --name --type --institution --currency` and `mon account list` commands.

## Capabilities

### New Capabilities
- `database-foundation`: SQLite connection lifecycle (default/overridable path), ordered SQL migrations applied on startup, and the `accounts`/`transactions` schema they create, including the integer-minor-units money rule.
- `account-management`: the `mon` CLI entrypoint and its `account add` / `account list` subcommands.

### Modified Capabilities
(none — first change in this project)

## Impact

- Adds `src/` to the repo: project config (`package.json`, `tsconfig.json`, lint/format config), CLI source, migration SQL files, and tests.
- Introduces runtime dependencies: `better-sqlite3`, a CLI arg-parsing library (`commander`), and a test runner (`vitest`).
- Establishes conventions later tasks (ENG-180, ENG-181, ENG-182) depend on directly: the `Cents` type, the migration mechanism (task 4 adds an `import_batches` migration on top of it), and the DB path override env var (used by every task's tests).
