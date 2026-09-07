-- import_batch_id is a plain nullable column with no REFERENCES clause: the
-- import_batches table doesn't exist yet (it lands in a later task), and
-- SQLite cannot retroactively attach a foreign key to an existing column.
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts (id),
  posted_date TEXT NOT NULL,
  amount_minor_units INTEGER NOT NULL,
  currency TEXT NOT NULL,
  description TEXT NOT NULL,
  raw_source_row TEXT NOT NULL,
  import_batch_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
