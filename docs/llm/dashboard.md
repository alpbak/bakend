# Dashboard (LLM Reference)

> Milestone 10 — SvelteKit admin UI at `/_/`

## URL

- Dashboard: `/_/`
- Login: `/_/login`
- Health: `/`, `/health` (unchanged)

## Auth

- Login: `POST /api/auth/login`
- Session check: `GET /api/auth/me`
- Admin routes: `/api/admin/*` require `role === "admin"`

## Admin API

```http
GET/POST   /api/admin/collections
GET/PUT/DELETE /api/admin/collections/:name
GET        /api/admin/users
PATCH/DELETE /api/admin/users/:id
GET        /api/admin/storage
GET        /api/admin/functions
GET        /api/admin/jobs
GET        /api/admin/jobs/:name/runs
GET        /api/admin/logs
```

Full reference: `docs/api/admin-api.md`

## Build

```bash
bun run dashboard:build   # output: dashboard/build/
bun run dashboard:dev       # Vite dev server, proxies /api
```

## Config

`dashboard.enabled` in `bakend.json` (default `true`). Env: `BAKEND_DASHBOARD_ENABLED`.

## Admin bypass

`admin` role bypasses collection `permissions` on `/api/:collection` CRUD.

## Schema migration (inline)

Add/remove/rename fields via `PUT /api/admin/collections/:name`. Type changes on existing columns rejected. Full `bak migrate` CLI deferred to RFC-0012.

## Modules

```text
src/core/api/admin/
src/core/collections/migrate-schema.ts
src/core/server/serve-dashboard.ts
dashboard/   # SvelteKit app
```
