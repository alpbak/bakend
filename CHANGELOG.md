# Changelog

All notable changes to Bakend are documented in this file.

## [Unreleased]

### Added

- Milestone 11 SDKs: JavaScript/TypeScript client (`@bakend/client`) and Dart client (`bakend`) for auth, CRUD, storage, and realtime.
- SDK packages: `sdk/javascript/`, `sdk/dart/`.
- SDK integration tests: `tests/sdk/javascript/`, `sdk/dart/test/`.
- Documentation: `docs/sdk/javascript.md`, `docs/sdk/dart.md`, `docs/llm/sdk.md`.
- RFC-0009 SDK Design (full specification).
- Example: `examples/sdk-demo/`.
- Milestone 10 Dashboard: SvelteKit admin UI at `/_/`, admin HTTP API, collection schema migration, in-memory log buffer, static asset serving.
- Admin endpoints: `/api/admin/collections`, `/users`, `/storage`, `/functions`, `/jobs`, `/logs`; `GET /api/auth/me`.
- `CollectionsEngine.update()` and `CollectionsEngine.delete()` with inline SQLite migrations.
- `dashboard.enabled` config (`BAKEND_DASHBOARD_ENABLED`).
- API documentation: `docs/api/admin-api.md`.
- User guide: `docs/user-guide/dashboard.md`.
- LLM reference: `docs/llm/dashboard.md`.
- RFC-0011 Admin Dashboard.
- Example: `examples/dashboard-demo/`.
- Milestone 9 Realtime: WebSocket server at `/api/realtime`, subscribe/unsubscribe protocol, wildcard channels (`posts.*`), JWT auth via header or `?token=`, collection read-permission filtering.
- Event Bus `onAny()` for realtime fan-out (runs before type-specific handlers).
- API documentation: `docs/api/websocket-api.md`.
- User guide: `docs/user-guide/realtime.md`.
- LLM reference: `docs/llm/realtime.md`.
- RFC-0006 Implementation section.
- Example: `examples/realtime-demo/`.
- Milestone 8 Storage: local filesystem storage, authenticated uploads, public/protected download ACLs, file metadata in `_files` table (schema version `3`).
- Storage endpoints: `POST /api/storage/upload`, `GET /api/storage/:id`, `DELETE /api/storage/:id`.
- Collection `file` field validation against `_files.id`.
- `storage` in function and job context (`get`, `delete`).
- Events: `storage.uploaded`, `storage.deleted`.
- API documentation: `docs/api/storage.md`.
- User guide: `docs/user-guide/storage.md`.
- LLM reference: `docs/llm/storage.md`.
- RFC-0007 Implementation section.
- Example: `examples/storage-demo/`.
- Milestone 7 Authentication: email/password registration and login, JWT access tokens, refresh sessions, collection permission enforcement, and auth event emissions.
- Auth endpoints: `POST /api/auth/register`, `/login`, `/refresh`, `/logout`.
- System user store (`_users`, `_sessions` tables); schema version `2`.
- Collection `permissions` block (`public`, `authenticated`, `owner`, `admin`) with `user_id` owner convention.
- `auth` config in `bakend.json` (`jwtSecret`, `accessTokenTtl`, `refreshTokenTtl`).
- `auth` field in function context; `onLogin` / `onRegister` events are live.
- Auth wired into `start()` via `StartResult.auth`.
- API documentation: `docs/api/auth.md`.
- User guide: `docs/user-guide/authentication.md`.
- RFC-0005 Implementation section.
- Example: `examples/auth-demo/`.
- Milestone 6 Jobs Engine: cron-based job discovery, in-process scheduler, execution with retry, lifecycle events, in-memory run history, and hot reload.
- Jobs wired into `start()` via `StartResult.jobs`.
- User guide: `docs/user-guide/jobs.md`.
- LLM reference: `docs/llm/jobs.md`.
- RFC-0004 Implementation section.
- Example: `examples/jobs-demo/`.
- Milestone 5 Functions Engine: TypeScript function discovery, trigger registration (`onCreate`, `onUpdate`, `onDelete`, `onLogin`, `onRegister`), Event Bus execution, lifecycle events, and hot reload.
- `bakend/functions` package export for trigger helpers.
- `bak dev` command and `bak start --watch` for function hot reload.
- Functions wired into `start()` via `StartResult.functions`.
- User guide: `docs/user-guide/functions.md`.
- LLM reference: `docs/llm/functions.md`.
- RFC-0003 Implementation section.
- Milestone 4 CRUD API: auto-generated REST endpoints for all collections (`GET/POST /api/{collection}`, `GET/PUT/DELETE /api/{collection}/:id`).
- `RecordStore` API: `create`, `get`, `list`, `update`, `delete` with validation and SQLite persistence.
- Record serialization layer: camelCase API fields, snake_case SQLite columns, type coercion for boolean/json.
- Emits `{collection}.created`, `{collection}.updated`, `{collection}.deleted` on record CRUD.
- Records wired into `start()` via `StartResult.recordStore`.
- API documentation: `docs/api/rest-api.md`.
- Milestone 3 Collections Engine: dynamic collection definitions, SQLite schema generation, metadata persistence (`_collections`), record validation, and `collections/*.json` loading at startup.
- `CollectionsEngine` API: `create`, `get`, `list`, `exists`, `validateRecord`.
- Collections wired into `start()` via `StartResult.collections`.
- Emits `system.collection.created` on collection creation.
- User guide: `docs/user-guide/collections.md`.
- LLM reference: `docs/llm/collections.md`.
- RFC-0002 Implementation section: metadata table, SQL mapping, reserved names.
- Milestone 2 Event Bus: in-memory pub/sub with `on()`, `emit()`, `BakendEvent` schema, handler error isolation, and automatic event logging.
- Event Bus wired into `start()` via `StartResult.eventBus`.
- User guide: `docs/user-guide/events.md`.
- LLM reference: `docs/llm/event-bus.md`.
- Milestone 1 core runtime: `bak start` command, configuration loader, SQLite bootstrap, HTTP server, and logging system.
- Health endpoints at `/` and `/health`.
- Environment variable overrides for config values.

### Changed

- Database bootstrap schema version bumped to `2`; adds `_users` and `_sessions` tables.
- `users` collection name is reserved; `/api/users` CRUD is blocked.
- Collection relation fields may reference system `users` collection.
- Database bootstrap schema version bumped to `1`; adds `_collections` metadata table.
- Milestone 0 project foundation: repository structure, documentation skeleton, Bun tooling, and CI workflow.
