## Purpose

Provides the persistent SQLite store that every `mon` command reads and writes, defines how its schema evolves as the project grows, and fixes the rule — integer minor units, no floats — that every monetary value in the system must follow.

## ADDED Requirements

### Requirement: Ordered, idempotent schema migrations
The system SHALL bring the database schema up to date by applying pending migrations in a fixed, well-defined order before any command runs against it, and SHALL apply each migration at most once regardless of how many times the command is invoked.

#### Scenario: Fresh database receives every migration
- **WHEN** `mon` runs against a database file that does not yet exist or is empty
- **THEN** every migration is applied, in order, before the command proceeds

#### Scenario: Already-migrated database is left alone
- **WHEN** `mon` runs against a database that already has all migrations applied
- **THEN** no migration is re-applied and the command proceeds without error

#### Scenario: A newly added migration is picked up
- **WHEN** `mon` runs against a database that is missing one or more of the migrations shipped in the current version
- **THEN** only the missing migrations are applied, in order, and prior data is preserved

### Requirement: Configurable database location
The system SHALL store its database at a sensible default per-user path, and SHALL use an alternate path when one is supplied via an environment variable, so tests and alternate profiles never touch a user's real data.

#### Scenario: Default location is used
- **WHEN** `mon` runs with no database-location override set
- **THEN** it reads and writes the default per-user database file, creating it (and applying migrations) if it does not exist

#### Scenario: Override location is honored
- **WHEN** `mon` runs with the database-location environment variable set to a path
- **THEN** it reads and writes that path instead of the default, creating it if it does not exist

### Requirement: Accounts schema
The system SHALL persist accounts with a unique identifier, a name, a type restricted to `checking`, `savings`, or `credit`, an institution label, a currency, and a creation timestamp, and SHALL reject any attempt to persist an account with a type outside that set.

#### Scenario: Account with a valid type is stored
- **WHEN** an account is created with type `checking`, `savings`, or `credit`
- **THEN** it is persisted with that type and a creation timestamp is recorded

#### Scenario: Account with an invalid type is rejected
- **WHEN** an account is created with a type outside `checking`, `savings`, `credit`
- **THEN** the system rejects the write and no account record is created

### Requirement: Transactions schema
The system SHALL persist transactions with a unique identifier, a reference to the owning account, a posted date, an amount stored as an integer number of minor currency units, a currency, a description, the raw source row as JSON, an optional (nullable) reference to an import batch, and a creation timestamp. The system SHALL NOT represent any monetary amount as a floating-point value anywhere in the transaction's stored or computed representation.

#### Scenario: Transaction amount is an integer minor-unit value
- **WHEN** a transaction is created with an amount
- **THEN** the stored amount is an integer representing minor currency units (e.g. cents), never a float or a decimal string

#### Scenario: Transaction retains its raw source row
- **WHEN** a transaction is created from a source record
- **THEN** the original source row is persisted alongside it as JSON, unmodified

#### Scenario: Transaction can exist without an import batch
- **WHEN** a transaction is created with no import batch reference
- **THEN** it is persisted successfully with that reference left unset
