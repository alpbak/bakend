# RFC-0014 Backup and Restore

Defines local backup and restore for Bakend project data.

## Purpose

Operators must protect `bakend.db` and the storage directory before upgrades or schema experiments.

## Goals (v1.0)

- `bak backup create [--output path]` — gzip tarball containing database file and `storage/`
- `bak backup restore <archive> [--force]` — replace database and storage from archive

## Procedure

1. Stop Bakend (`systemctl stop bakend` or Ctrl+C)
2. `bak backup create`
3. Perform upgrade or migration
4. On failure: `bak backup restore bakend-backup-....tar.gz --force`

## Archive Layout

```text
bakend.db
storage/
```

Paths inside the archive use the basename of the configured database file and a `storage/` directory.

## Non-Goals

- Cloud upload (S3, R2)
- Incremental backups
- Point-in-time recovery
- Hot backup while server is running (copy may be inconsistent under heavy write load; stop server for safest restore)

## Status

Implemented — Milestone 14
