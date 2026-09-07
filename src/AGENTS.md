# `src/` — the `mon` project

This is its own npm package (own `package.json`, `tsconfig.json`, `node_modules`), separate from the
root `package.json`, which belongs to jen. Run `npm install --prefix src` once before working here;
day-to-day the root proxy scripts (`npm run build|lint|typecheck|test`) are the only entrypoint later
pipeline stages use.

## Money: `Cents`, never a bare `number`

Every monetary value — schema column and function signature alike — is typed `Cents`
(`src/money/cents.ts`): a branded integer-minor-units type, constructed via `toCents()`, which throws
on non-integer input. No floats or decimal strings anywhere in the money path; passing a bare `number`
where money is expected is a type error, not just a convention.

## Migrations

Ordered `.sql` files under `src/db/migrations/`, applied in filename order by `runMigrations`
(`src/db/migrator.ts`), tracked in a `schema_migrations` table so re-running is a no-op. `npm run build`
copies them into `dist/db/migrations` alongside the compiled JS — the migrator resolves its migrations
directory relative to its own module location, so this layout has to stay parallel between `src/` and
`dist/`.

`transactions.import_batch_id` is a plain nullable column with no FK constraint yet: the
`import_batches` table doesn't exist until a later task, and SQLite can't retroactively attach a
foreign key to an existing column. Don't add the constraint without adding that table in the same
migration.
