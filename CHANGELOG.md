# Changelog

All notable changes to Bakend are documented in this file.

## [Unreleased]

### Added

- Milestone 2 Event Bus: in-memory pub/sub with `on()`, `emit()`, `BakendEvent` schema, handler error isolation, and automatic event logging.
- Event Bus wired into `start()` via `StartResult.eventBus`.
- User guide: `docs/user-guide/events.md`.
- LLM reference: `docs/llm/event-bus.md`.
- Milestone 1 core runtime: `bak start` command, configuration loader, SQLite bootstrap, HTTP server, and logging system.
- Health endpoints at `/` and `/health`.
- Environment variable overrides for config values.

### Changed

- Milestone 0 project foundation: repository structure, documentation skeleton, Bun tooling, and CI workflow.
