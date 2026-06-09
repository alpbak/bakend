# RFC-0012 Migration Engine

Defines collection schema synchronization between `collections/*.json` files and the SQLite metadata store.

## Purpose

Developers version-control collection schemas as JSON files. The dashboard can edit schemas in the database, but file-based workflows need explicit sync commands.

## Goals (v1.0)

- `bak migrate status` — report synced, drift, file-only, and db-only collections
- `bak migrate apply` — create or update collections from JSON files
- `bak migrate export` — write database definitions to `collections/*.json`

## Rules

- Apply uses the same inline SQLite migrations as the dashboard (`CollectionsEngine.update`)
- Field type changes on existing columns are rejected
- Collection renames are not supported (delete + create manually)
- No automatic rollback; use `bak backup restore` (RFC-0014)

## Non-Goals

- `bak migrate rollback`
- Writing dashboard edits back to JSON automatically
- PocketBase-style migration history tables

## Status

Implemented — Milestone 14
