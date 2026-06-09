# RFC-0008 CLI and Project Structure

Defines CLI commands and generated project layout.

## Purpose

Developers interact with Bakend primarily through the `bak` executable. Projects follow a predictable directory layout so `bak start` works without configuration ceremony.

## Project Layout

```text
myapp/
  bakend.json
  .gitignore
  collections/       # Collection JSON definitions
  functions/         # TypeScript event handlers
  jobs/              # Scheduled TypeScript jobs
  bakend.db          # SQLite database (created on first start)
  storage/           # Uploaded files (created on first start)
```

`bakend.json` paths are relative to the config file directory.

## Commands

| Command | Description | Status |
|---|---|---|
| `bak init [name]` | Scaffold a new project | Implemented |
| `bak start [--config <path>] [--watch]` | Start HTTP server | Implemented |
| `bak dev [--config <path>]` | Start with hot reload | Implemented |
| `bak version` | Print version | Implemented |
| `bak functions list` | List function triggers | Implemented |
| `bak jobs list` | List jobs | Implemented |
| `bak jobs runs <name>` | Job run history | Implemented |
| `bak migrate status` | Diff JSON vs database | Implemented |
| `bak migrate apply` | Apply JSON to database | Implemented |
| `bak migrate export` | Export database to JSON | Implemented |
| `bak backup create` | Backup db + storage | Implemented |
| `bak backup restore` | Restore from archive | Implemented |
| `bak storage prune` | Remove orphan files | Implemented |

## `bak init`

Creates:

- `bakend.json` with generated `auth.jwtSecret`
- `.gitignore` for `bakend.db`, `storage/`, `.bakend-cache/`
- Empty `collections/`, `functions/`, `jobs/` directories
- `README.md` with quick start

Rules:

- With `name`, creates `name/` under the current directory
- Without `name`, initializes the current directory if empty
- Refuses non-empty target directories

## Configuration

Default config file: `./bakend.json`

See `bakend.json.example` and `docs/user-guide/getting-started.md`.

## Status

Implemented — Milestone 14
