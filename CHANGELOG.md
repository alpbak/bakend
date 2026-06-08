# Changelog

All notable changes to Bakend are documented in this file.

## [Unreleased]

### Added

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

- Database bootstrap schema version bumped to `1`; adds `_collections` metadata table.
- Milestone 0 project foundation: repository structure, documentation skeleton, Bun tooling, and CI workflow.
