## Purpose

Lets a user register the financial accounts `mon` tracks and see what's already registered, through the `mon` command-line interface that later capabilities (import, tagging) will extend with their own subcommand groups.

## ADDED Requirements

### Requirement: `mon` command-line entrypoint
The system SHALL provide a `mon` command-line entrypoint organized into subcommand groups (starting with `account`), and SHALL report an unrecognized top-level command or subcommand with a clear error message and a non-zero exit code rather than failing silently or crashing with a stack trace.

#### Scenario: Help lists available subcommand groups
- **WHEN** a user runs `mon --help`
- **THEN** the `account` subcommand group is listed with a description

#### Scenario: Unknown command is rejected clearly
- **WHEN** a user runs `mon` with a top-level command that does not exist
- **THEN** the system prints a clear error identifying the unknown command and exits with a non-zero status

### Requirement: Add an account
The system SHALL provide `mon account add`, accepting a name, a type, an institution label, and a currency, and SHALL create a new account only when the type is one of `checking`, `savings`, or `credit` and all required fields are present.

#### Scenario: Valid account is added
- **WHEN** a user runs `mon account add` with a name, a valid type, an institution, and a currency
- **THEN** a new account is created and the command prints confirmation including the new account's identifier

#### Scenario: Invalid type is rejected
- **WHEN** a user runs `mon account add` with a type that is not `checking`, `savings`, or `credit`
- **THEN** the system prints a clear validation error, exits with a non-zero status, and creates no account

#### Scenario: Missing required field is rejected
- **WHEN** a user runs `mon account add` omitting the name, type, institution, or currency
- **THEN** the system prints a clear validation error, exits with a non-zero status, and creates no account

### Requirement: List accounts
The system SHALL provide `mon account list`, which prints every registered account with its name, type, institution, and currency.

#### Scenario: Listing with existing accounts
- **WHEN** a user runs `mon account list` and one or more accounts are registered
- **THEN** each account is printed with its name, type, institution, and currency

#### Scenario: Listing with no accounts
- **WHEN** a user runs `mon account list` and no accounts are registered
- **THEN** the system prints a message indicating there are none, rather than an empty or blank output
