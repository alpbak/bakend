# SDK Summary

> Status: Implemented (Milestone 11)

## Packages

| Language | Package | Path |
|----------|---------|------|
| JavaScript / TypeScript | `@bakend/client` | `sdk/javascript/` |
| Dart / Flutter | `bakend` | `sdk/dart/` |

Publishing to npm/pub.dev is planned post-beta (workspace install during v0.1 beta).

## Entry Point

```ts
const client = new BakendClient("http://localhost:8080");
```

```dart
final client = BakendClient('http://localhost:8080');
```

## Modules

| Module | Covers |
|--------|--------|
| `client.auth` | register, login, refresh, logout, getMe |
| `client.collection(name)` | list, get, create, update, delete |
| `client.storage` | upload, download, getDownloadUrl, delete |
| `client.realtime` | subscribe, unsubscribe, disconnect |

## Auth

- Tokens stored in pluggable `AuthStore` (memory default; browser localStorage/sessionStorage in JS)
- HTTP requests auto-attach `Authorization: Bearer <token>`
- Realtime uses `?token=<jwt>` query param
- `autoRefresh: true` (default) retries once on 401 via refresh token

## Errors

- JS: `BakendError` with `code`, `message`, `status`, `details?`
- Dart: `BakendException` with same fields

## Non-Goals (V1)

- Admin API client
- Pagination / filtering
- Code-generated collection types
- Auto WebSocket reconnect

## Tests

```bash
bun test tests/sdk      # JS integration tests
bun run test:dart       # Dart integration tests (requires Dart SDK)
```

## Examples

- `examples/sdk-demo/` — Bun script using `@bakend/client`

## Full Docs

- `docs/sdk/javascript.md`
- `docs/sdk/dart.md`
- RFC-0009 SDK Design
