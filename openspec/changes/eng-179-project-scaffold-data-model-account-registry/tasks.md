## 1. Project scaffold

- [ ] 1.1 Create `src/package.json`, `src/tsconfig.json`, and the base directory layout; verify `npm install --prefix src` completes without error
- [ ] 1.2 Add root-level proxy scripts (`build`, `lint`, `typecheck`, `test`) to the repo-root `package.json`, each delegating to `src` (e.g. `--prefix src`); verify `npm run build`, `npm run lint`, `npm run typecheck`, and `npm run test` all succeed from the repo root
- [ ] 1.3 Add lint/format config consistent with the rest of the repo; verify `npm run lint` passes on the initial scaffold
- [ ] 1.4 Add `vitest` and a placeholder test; verify `npm run test` runs and passes it

## 2. Database and migrations

- [ ] 2.1 Add `better-sqlite3` and a connection module that resolves the default per-user database path, overridable by `MON_DB_PATH`; verify a unit test confirms the env-var override is honored and the default path is used when unset
- [ ] 2.2 Implement the migration runner: applies ordered `.sql` files in a transaction and tracks applied migrations in a `schema_migrations` table; verify unit tests cover a fresh database receiving every migration, a fully-migrated database being a no-op, and a newly added migration being picked up on the next run
- [ ] 2.3 Add the `accounts` table migration (id, name, type constrained to `checking`/`savings`/`credit`, institution, currency, created timestamp); verify a unit test that a valid type is stored and an invalid type is rejected with no row created
- [ ] 2.4 Add the `transactions` table migration (id, account FK, posted date, amount as integer, currency, description, raw source row as JSON, nullable `import_batch_id` with no FK constraint yet, created timestamp); verify unit tests that a transaction stores an integer amount and its raw source row, and that it can be created with `import_batch_id` unset

## 3. Money type

- [ ] 3.1 Implement the branded `Cents` type and its constructor/arithmetic helpers in one module; verify unit tests cover construction from an integer and rejection of non-integer input
- [ ] 3.2 Document the `Cents` convention (no floats in the money path) in `src/AGENTS.md`; verify the file exists and states the rule

## 4. `mon` CLI

- [ ] 4.1 Implement the `mon` entrypoint on `commander` with subcommand-group structure and unknown-command handling; verify `mon --help` lists the `account` group and running an unrecognized command prints a clear error with a non-zero exit code
- [ ] 4.2 Implement `mon account add` (name, type, institution, currency); verify tests for: valid input creates the account and prints its id; an invalid type is rejected with a non-zero exit and no account created; a missing required field is rejected the same way
- [ ] 4.3 Implement `mon account list`; verify tests for: existing accounts are printed with name/type/institution/currency; the no-accounts case prints an explicit empty-state message rather than blank output

## 5. Verification

- [ ] 5.1 Run the full test suite from the repo root (`npm run test`) and confirm every scenario in `specs/database-foundation/spec.md` and `specs/account-management/spec.md` has a corresponding passing test
- [ ] 5.2 Exercise `mon account add` and `mon account list` end-to-end against a scratch database (via `MON_DB_PATH`) and confirm the observed output matches the spec scenarios
