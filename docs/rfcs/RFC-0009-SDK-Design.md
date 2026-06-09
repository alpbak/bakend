# RFC-0009 SDK Design

Defines client SDK architecture for JavaScript, TypeScript, and Dart.

## Purpose

Bakend exposes REST and WebSocket APIs. Client SDKs wrap those APIs so applications integrate without hand-rolling HTTP and WebSocket calls.

## Goals

- Single entry point per language (`BakendClient`)
- Authentication with token persistence
- Collection CRUD
- File storage (upload, download, delete)
- Realtime subscriptions
- Structured error handling
- Zero runtime dependencies for JS/TS (native `fetch` + `WebSocket`)

## Architecture

```text
Application
     │
     ▼
 BakendClient
     ├── auth       → /api/auth/*
     ├── collection → /api/{name}
     ├── storage    → /api/storage/*
     └── realtime   → WS /api/realtime
```

SDKs are thin HTTP/WebSocket wrappers. They do not embed server logic.

## Public API

```ts
const client = new BakendClient("http://localhost:8080");

await client.auth.register({ email, password });
await client.auth.login({ email, password });
await client.auth.refresh();
await client.auth.logout();
await client.auth.getMe();

const posts = client.collection("posts");
await posts.list();
await posts.get(id);
await posts.create({ title: "Hello" });
await posts.update(id, { title: "Updated" });
await posts.delete(id);

await client.storage.upload(file, { visibility: "public" });
await client.storage.download(id);
await client.storage.getDownloadUrl(id);
await client.storage.delete(id);

const off = client.realtime.subscribe("posts.*", (event) => {});
client.realtime.unsubscribe("posts.*");
client.realtime.disconnect();
```

## JavaScript / TypeScript Package

One package (`@bakend/client`) serves both JavaScript and TypeScript consumers. TypeScript source exports `.d.ts` types.

### Module Layout

```text
sdk/javascript/src/
  client.ts
  http.ts
  auth.ts
  collection.ts
  storage.ts
  realtime.ts
  errors.ts
  types.ts
  stores/
    memory.ts
    browser.ts
```

### Targets

- Bun
- Node 18+
- Browsers (modern `fetch` + `WebSocket`)

## Dart Package

```text
sdk/dart/lib/
  bakend.dart
  src/
    client.dart
    http_client.dart
    auth.dart
    collection.dart
    storage.dart
    realtime.dart
    errors.dart
    types.dart
```

Dependencies: `http`, `web_socket_channel`.

## Auth Store

Tokens are persisted through a pluggable store interface:

```ts
interface AuthStore {
  getToken(): string | null;
  setToken(token: string): void;
  getRefreshToken(): string | null;
  setRefreshToken(token: string): void;
  clear(): void;
}
```

Default: in-memory store. Browser adapters: `localStorage`, `sessionStorage`.

The auth module reads/writes tokens via the store. HTTP requests attach `Authorization: Bearer <token>` when a token is present.

## Auto-Refresh

When `autoRefresh` is enabled (default `true`), a `401` response triggers one `auth.refresh()` attempt and retries the original request. If refresh fails, the error propagates and tokens are cleared.

## Error Model

Server errors use:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "details": [{ "field": "title", "rule": "required", "message": "..." }]
  }
}
```

SDKs throw `BakendError` (JS) / `BakendException` (Dart) with:

- `code` — server error code
- `message` — human-readable message
- `status` — HTTP status code
- `details` — optional validation detail array

## REST Mapping

| SDK method | HTTP |
|------------|------|
| `auth.register` | `POST /api/auth/register` |
| `auth.login` | `POST /api/auth/login` |
| `auth.refresh` | `POST /api/auth/refresh` |
| `auth.logout` | `POST /api/auth/logout` |
| `auth.getMe` | `GET /api/auth/me` |
| `collection.list` | `GET /api/{name}` |
| `collection.get` | `GET /api/{name}/:id` |
| `collection.create` | `POST /api/{name}` |
| `collection.update` | `PUT /api/{name}/:id` |
| `collection.delete` | `DELETE /api/{name}/:id` |
| `storage.upload` | `POST /api/storage/upload` (multipart) |
| `storage.download` | `GET /api/storage/:id` |
| `storage.delete` | `DELETE /api/storage/:id` |

List responses return `{ items: Record[] }`. Create returns the record. Delete returns void (204).

## Realtime Mapping

Connect to `WS {baseUrl}/api/realtime?token=<jwt>` when authenticated.

| SDK method | Protocol |
|------------|----------|
| `subscribe(channel, cb)` | send `{ action: "subscribe", channel }`; invoke `cb` on `{ type: "event" }` |
| `unsubscribe(channel)` | send `{ action: "unsubscribe", channel }` |
| `disconnect()` | close WebSocket |

`subscribe` returns an unsubscribe function. Connection is lazy — first subscribe opens the socket.

## V1 Non-Goals

- Admin API client (`/api/admin/*`)
- Pagination, filtering, sorting
- Code-generated per-collection types
- Automatic WebSocket reconnect (added in 1.0)
- Dashboard refactor to use SDK

## Test Strategy

Integration tests spin up `createTestServer()` and exercise SDK methods against a live port. JS tests live in `tests/sdk/javascript/`. Dart tests live in `sdk/dart/test/`.

## Implementation (Milestone 11)

Packages are workspace-local:

- `sdk/javascript/` — import as `@bakend/client` from workspace
- `sdk/dart/` — path dependency in `pubspec.yaml`

Examples: `examples/sdk-demo/`.
