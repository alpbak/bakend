# RFC-0018 Versioning and Upgrade Policy

Defines semantic versioning, release compatibility, and upgrade procedures for Bakend.

## Purpose

Operators need predictable rules for when they can safely replace the `bak` binary without data loss or manual intervention.

## Version Source of Truth

`src/version.ts` defines:

- `VERSION` — full semver (e.g. `0.1.0`)
- `VERSION_DISPLAY` — short display string (e.g. `0.1`)

Release tags use `v{VERSION}` (e.g. `v0.1.0`).

The `bak version` command prints `VERSION`.

## Semantic Versioning

Bakend follows [semver](https://semver.org/):

| Bump | When | Upgrade expectation |
|---|---|---|
| **Patch** (0.1.x) | Bug fixes, no schema changes | Replace binary; restart |
| **Minor** (0.x.0) | New features, backward-compatible schema migrations | Replace binary; restart; internal migrations run automatically |
| **Major** (x.0.0) | Breaking changes | Review release notes; may require config or project changes |

Bakend 1.0+ follows semver: patch and minor upgrades are backward compatible for project data and config. Major bumps may require operator action documented in release notes.

## Internal Schema Migration

Bakend stores internal schema version in `_bakend_meta.schema_version`.

On every `bak start`, `initDatabase()` in `src/core/database/init.ts`:

1. Runs bootstrap SQL
2. Applies sequential migrations (e.g. 1→2→3)

Operators do not run migrations manually for internal schema. Upgrading the binary is sufficient.

Collection schema changes from the dashboard use inline SQLite migrations in `CollectionsEngine` — separate from internal schema version.

## Binary vs Project Compatibility

| Component | Owned by | Upgrade impact |
|---|---|---|
| Internal tables (`_users`, `_sessions`, `_files`, etc.) | Platform | Migrated automatically |
| User collections | Project | Unaffected by binary upgrade |
| `bakend.json` config | Project | New optional keys use defaults; removed keys ignored with warning |
| `functions/`, `jobs/` | Project | Unaffected unless release notes specify API changes |
| Database file path | Project config | Unchanged |
| Storage path | Project config | Unchanged |

### Config compatibility rules

- **Adding** config keys: safe; defaults apply for missing keys
- **Removing** config keys: safe; old values in file are ignored
- **Changing** config semantics: documented in CHANGELOG; may require manual config edit on major bumps

### JWT secret

`auth.jwtSecret` must remain stable across upgrades. Changing it invalidates existing sessions and tokens.

## Upgrade Procedure

### Standard upgrade (patch/minor)

```bash
systemctl stop bakend
cp bakend.db bakend.db.bak-$(date +%Y%m%d)
tar czf storage.bak-$(date +%Y%m%d).tar.gz storage/
# Replace /opt/bakend/bak with new release binary
/opt/bakend/bak version
systemctl start bakend
curl -s http://localhost:8080/health
```

### Docker upgrade

```bash
docker pull ghcr.io/owner/bakend:v0.2.0
docker compose down
docker compose up -d
```

Data persists in the mounted `/data` volume.

### Rollback

If upgrade fails:

1. Stop service
2. Restore previous binary
3. Restore database backup if schema was partially migrated (rare — migrations are transactional)
4. Start service

Use `bak backup create` before upgrades and `bak backup restore <archive> --force` to roll back (RFC-0014).

## Downgrade Policy

Downgrading to an older binary with a **higher** internal `schema_version` is unsupported and may fail at startup. Always backup before upgrading.

## Release Verification

After upgrade, verify:

- `bak version` matches expected release
- `GET /health` returns `{ "status": "ok", "version": "..." }`
- Dashboard loads at `/_/`
- Existing collections and records are accessible

## Non-Goals (Milestone 12)

- `bak upgrade` command with automatic download
- `bak upgrade --check` against GitHub Releases API
- `bak upgrade` with automatic download from GitHub Releases

## Status

Implemented — Milestone 14
