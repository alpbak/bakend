# SDK Summary

> Status: Implemented (Milestone 11) · npm and pub.dev (Milestone 14)

## Packages

| Language | Package | Install |
|----------|---------|---------|
| JavaScript / TypeScript | `@bakend/client` | `npm install @bakend/client` |
| Dart / Flutter | `bakend` | `dart pub add bakend` |

## Surface

- `BakendClient({ baseUrl, token? })`
- `auth` — register, login, refresh, logout, getMe
- `collection(name)` — CRUD
- `storage` — upload, download, delete
- `realtime` — subscribe with auto-reconnect

## Non-Goals (V1)

- Admin API client (`/api/admin/*`)
- Pagination, filtering, sorting helpers
- Code-generated per-collection types

## Tests

- `tests/sdk/javascript/`
- `sdk/dart/test/`

## Example

`examples/sdk-demo/`
