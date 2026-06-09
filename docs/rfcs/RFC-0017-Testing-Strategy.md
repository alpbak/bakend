# RFC-0017 Testing Strategy

Defines how Bakend validates correctness across subsystems.

## Test Pyramid

| Layer | Location | Scope |
|---|---|---|
| Unit | `tests/core/` | Engines, validation, serialization |
| HTTP API | `tests/core/api/` | REST, admin, auth |
| CLI | `tests/cli/` | init, migrate, backup, start |
| SDK | `tests/sdk/javascript/`, `sdk/dart/test/` | Client integration against live server |
| Packaging | `tests/packaging/` | Binary build (opt-in `BAKEND_RUN_PACKAGING_BUILD=1`) |

## CI (GitHub Actions)

On every PR and push to `main`:

- Documentation structure check
- Typecheck
- `bun test` (full suite)
- Dashboard build + Svelte check
- Linux x64 packaging build
- Website build
- `bak init` smoke test

## Local Commands

```bash
bun test
bun run test:sdk
bun run test:dart
BAKEND_RUN_PACKAGING_BUILD=1 bun test tests/packaging
```

## Guidelines

- Prefer integration tests against real SQLite over heavy mocking
- CLI commands use temp directories; never touch repo `bakend.db`
- Coverage is informative, not a merge gate (keep CI fast)

## Status

Implemented — Milestone 14
