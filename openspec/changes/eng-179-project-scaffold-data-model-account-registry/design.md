## Context

See `proposal.md` - Why for motivation. Relevant current state:

- The repo root today holds only the jen workflow itself: a root `package.json` whose sole dependency is `@reveer/jen`, `.claude/`, `openspec/`, `registry.yaml`. There is no `src/` yet — this task creates it from nothing.
- `.claude/settings.json` fixes the automation surface later stages (implement/review/test) can invoke to exactly `npm run build`, `npm run lint`, `npm run typecheck`, `npm run test`, run from the repo root. Whatever the internal project layout, those four root-level script names are the contract every later stage relies on.
- Nothing under `src/` exists to be consistent with, so this design is establishing convention, not following one.

## Goals / Non-Goals

**Goals:**
- Stand up a working TypeScript project, `mon` CLI, SQLite database, and migration mechanism that ENG-180/181/182 build directly on without re-deciding these choices.
- Keep jen's own tooling dependency (`@reveer/jen`) isolated from mon's runtime/dev dependencies.
- Make the four allowed root npm scripts the single, stable entrypoint into whatever mon's own build/lint/typecheck/test tools turn out to be.

**Non-Goals:**
- CSV parsing, per-institution mapping, `import_batches`, dedup — later tasks in the epic.
- Any UI beyond the CLI; multi-currency conversion; live bank APIs.

## Decisions

### `src/` is its own self-contained npm package
`src/` gets its own `package.json`, `tsconfig.json`, and `node_modules` — not new fields bolted onto the root `package.json`.

- **Rationale**: the root `package.json` belongs to jen, the workflow tooling installed into every project it governs. Mon's own dependencies (`better-sqlite3`, `commander`, `vitest`, `typescript`) shouldn't mix into that tree — a routine `jen update` commit (e.g. "Update jen to 0.3.2") shouldn't touch mon's lockfile, and adding a mon dependency shouldn't touch jen's.
- **Alternative considered**: a single root `package.json` holding both. Rejected — couples two independently-versioned concerns and makes every future dependency change ambiguous about which "project" it belongs to.
- **Consequence**: the root `package.json` gains four thin proxy scripts — `build`, `lint`, `typecheck`, `test` — each delegating with `--prefix src`. This is exactly what `.claude/settings.json`'s allowlist is scoped to: whatever mon's internal script names or tools are, these four root-level names are the fixed, stable contract later stages invoke.

### CLI framework: `commander`
- **Rationale**: named directly in the ticket; the standard choice for a Node CLI with nested subcommand groups, with enough typing and minimal boilerplate for `mon account add`/`list` today and `import`/`tag` groups later.
- **Alternative considered**: `clipanion` (also named in the ticket) — more type-safe but a heavier API for what two subcommands need right now.

### Test runner: `vitest`
- **Rationale**: the ticket leaves this choice to the implementer. Vitest gives native TypeScript support with no separate transpile/loader step, watch mode, and `describe`/`it.each` shapes that suit the table-driven tests ENG-180 explicitly calls for.
- **Alternative considered**: `node:test` — zero extra dependency, but weaker TypeScript ergonomics and no built-in table-driven-test helper as convenient as `it.each`.

### Migrations: numbered plain-SQL files, applied in order, tracked in-database
Migrations live as ordered `.sql` files (e.g. `001_accounts.sql`, `002_transactions.sql`) under `src/`, applied in filename order inside a transaction on every CLI startup. A `schema_migrations` table (filename, applied-at) in the same database records what has already run, so re-running is a no-op.

- **Rationale**: the ticket calls this sufficient ("plain SQL files applied in order is fine"); `better-sqlite3` already gives synchronous transactions, so no separate migration-runner dependency is needed.
- **Alternative considered**: a migration library (e.g. `umzug`) — unnecessary weight for a single-developer CLI with a handful of migrations.

### Database location: per-user default path, env-var override
Default to a per-OS per-user config location (created on first run if missing); an environment variable (`MON_DB_PATH`) overrides it when set, which is how tests and alternate profiles avoid the default.

- **Rationale**: matches the ticket directly ("a sensible per-user path, overridable by env var for tests") and is the standard pattern for single-user local-database CLIs.
- **Alternative considered**: requiring an explicit `--db` flag on every invocation — rejected as friction for what is normally one fixed, per-machine location.

### Money representation: a branded `Cents` type
A branded type (`type Cents = number & { readonly __brand: 'Cents' }`), with constructor and arithmetic helpers in one module, documented in `src/AGENTS.md`. Every monetary field — schema column and function signature alike — is typed `Cents`, never a bare `number` or a float.

- **Rationale**: the ticket requires no floats anywhere in the money path; branding makes passing an un-vetted `number` where money is expected a compile-time error, catching the mistake before it reaches SQLite.
- **Alternative considered**: a `Money` wrapper class with methods — more ceremony than this task's scope needs, since there's no currency-aware arithmetic yet, only storage and transport of integer minor units.

### `transactions.import_batch_id`: column now, constraint later
The column is added now as a nullable integer with no `REFERENCES` clause. Task 4 adds both the `import_batches` table and the FK constraint together, in its own migration.

- **Rationale**: SQLite can add a column to an existing table but cannot retroactively attach a foreign-key constraint to one; declaring the constraint now against a table that doesn't exist would only "work" with foreign-key enforcement turned off, which is fragile to accidentally violate before task 4 lands.
- **Alternative considered**: declare the FK constraint now, with enforcement disabled until task 4. Rejected — depends on remembering to keep enforcement off correctly across every connection in the meantime.

## Risks / Trade-offs

- [Two `package.json` files in one repo reads as unusual and could confuse a contributor expecting a single install step] → Mitigation: `src/AGENTS.md` documents the split and the one extra install command (`npm install --prefix src`) up front; day-to-day work through the four proxy scripts never needs to know the split exists.
- [Deferring the `import_batches` FK constraint leaves nothing stopping a future migration from getting the column's type or semantics wrong before task 4 adds the real constraint] → Mitigation: called out explicitly here and in the proposal's Impact section so task 4's design has to reconcile it rather than discover it late.
- [The per-user default database path is platform-dependent] → Mitigation: resolved once in a single small module so the platform-specific logic isn't duplicated across commands.

## Migration Plan

Not applicable — this is the first schema in a database that doesn't exist yet. No prior data, no rollback path beyond deleting the database file (which, until this ships, has never held anything but test data).
