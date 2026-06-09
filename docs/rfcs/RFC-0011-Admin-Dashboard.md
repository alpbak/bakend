# RFC-0011 Admin Dashboard

Defines the SvelteKit administration dashboard, admin HTTP API, schema migration for collection edits, and static asset serving.

## Purpose

Bakend needs a web UI so developers can manage collections, users, storage, functions, jobs, and logs without writing custom admin tools.

## Goals

- SvelteKit dashboard served at `/_/`
- Admin-only HTTP API at `/api/admin/*`
- Full collection schema CRUD from the UI (minimal inline migrations)
- Dashboard communicates only through HTTP APIs (no direct database access)

## Non-Goals (V1)

- Full Migration Engine CLI (`bak migrate`, rollback) — deferred to RFC-0012
- Persisting dashboard schema edits to `collections/*.json` files
- Job manual trigger from UI
- Function source code viewer
- Persistent log files — deferred to RFC-0013
- Single-executable dashboard bundling — deferred to RFC-0010 / Milestone 12

## Dashboard URL

```text
/_/              Dashboard home
/_/login         Login page
/_/collections   Collection management
/_/users         User management
/_/storage       File browser
/_/functions     Function triggers (read-only)
/_/jobs           Job schedules and run history
/_/logs           Recent server logs
```

Health checks remain at `/` and `/health`.

## Authentication

- Login uses existing `POST /api/auth/login`
- Dashboard stores JWT in `sessionStorage`
- `GET /api/auth/me` returns the current user
- All `/api/admin/*` routes require `role === "admin"` (401 unauthenticated, 403 non-admin)

## Admin Permission Bypass

Users with `admin` role bypass collection `permissions` rules for public CRUD endpoints (`/api/:collection`). This allows the dashboard to browse and edit all records.

## Admin API

```http
GET    /api/auth/me

GET    /api/admin/collections
POST   /api/admin/collections
GET    /api/admin/collections/:name
PUT    /api/admin/collections/:name
DELETE /api/admin/collections/:name

GET    /api/admin/users
PATCH  /api/admin/users/:id
DELETE /api/admin/users/:id

GET    /api/admin/storage
GET    /api/admin/functions
GET    /api/admin/jobs
GET    /api/admin/jobs/:name/runs
GET    /api/admin/logs
```

## Minimal Schema Migration (Milestone 10)

Collection schema updates from the dashboard run inline migrations:

| Change | Action |
|--------|--------|
| Add field | `ALTER TABLE ... ADD COLUMN` |
| Remove field | `ALTER TABLE ... DROP COLUMN` |
| Rename field | `ALTER TABLE ... RENAME COLUMN` |
| Permissions only | Update `_collections.definition` JSON |
| Change field type on existing column | Reject with error |
| Delete collection | `DROP TABLE`; reject if referenced by relation fields |

DDL runs inside a SQLite transaction. Emits `system.collection.updated` and `system.collection.deleted`.

## Static Asset Serving

- SvelteKit builds to `dashboard/build/` with `adapter-static` and base path `/_/`
- Bun server serves static files from `dashboard/build/` at `/_/*`
- SPA fallback: unknown paths under `/_/` return `index.html`
- If build directory is missing, log a warning and skip (API still works)

## Configuration

`bakend.json`:

```json
{
  "dashboard": {
    "enabled": true
  }
}
```

Env: `BAKEND_DASHBOARD_ENABLED` (boolean string).

## Implementation (Milestone 10)

### Module Layout

```text
src/core/collections/migrate-schema.ts
src/core/api/admin/
  router.ts
  handlers/collections.ts
  handlers/users.ts
  handlers/storage.ts
  handlers/functions.ts
  handlers/jobs.ts
  handlers/logs.ts
  require-admin.ts
src/core/server/serve-dashboard.ts
dashboard/                    # SvelteKit app
```

### Engine Extensions

- `CollectionsEngine.update()`, `CollectionsEngine.delete()`
- `AuthEngine.listUsers()`, `updateUserRole()`, `deleteUser()`
- `StorageEngine.list()`
- Logger ring buffer (`getRecentLogs()`)
- Admin bypass in `checkCollectionPermission()`

### Wiring

`createServer()` receives `functions`, `jobs`, log buffer, and `dashboard.enabled`. Routes `/api/admin/*` before collection CRUD. Serves `/_/*` before API fallback.
