# RFC-0006 Realtime Engine

Defines WebSocket architecture, subscription channels, authentication model, event propagation, and scalability assumptions.

## Purpose

Bakend delivers live updates to connected clients over WebSocket. The Realtime Engine listens to the internal Event Bus and fans out events to subscribed clients.

## Goals

- WebSocket endpoint on the same port as HTTP
- Subscribe/unsubscribe to event channels
- Wildcard channel matching (`posts.*`)
- JWT authentication (optional)
- Collection read-permission filtering on record events

## Architecture

```text
Record CRUD / Auth / Storage / Jobs / Functions
      │
      ▼
  Event Bus
      │
      ▼
 Realtime Engine
      │
      ▼
 WebSocket clients
```

Realtime is an Event Bus listener only. It does not couple directly to Collections, Auth, or Storage.

## Channels

Channel names match Event Bus event types (dot-separated):

| Category | Channels |
|----------|----------|
| Collections | `{name}.created`, `{name}.updated`, `{name}.deleted` |
| Auth | `auth.login`, `auth.logout`, `auth.register` |
| Storage | `storage.uploaded`, `storage.deleted` |
| Functions | `function.started`, `function.completed`, `function.failed` |
| Jobs | `job.started`, `job.completed`, `job.failed` |
| System | `system.collection.created` |

### Wildcards

A subscription ending in `.*` matches all events with that prefix:

- `posts.*` → `posts.created`, `posts.updated`, `posts.deleted`
- Exact match always works: `posts.created`

## Authentication

- Connections may be anonymous (for public collection subscriptions)
- JWT via `Authorization: Bearer <token>` header on upgrade
- JWT via `?token=<token>` query parameter (browser-friendly)
- Auth context is stored per connection and used for permission filtering

## Permission Filtering

Collection events (`{collection}.created|updated|deleted`) are filtered using the same `read` permission rule as the REST API before delivery.

Non-collection events use safe/metadata-only payloads and are delivered to all channel subscribers.

## Client Protocol

JSON text frames over WebSocket.

### Client → Server

```json
{ "action": "subscribe", "channel": "posts.created" }
{ "action": "unsubscribe", "channel": "posts.*" }
{ "action": "ping" }
```

### Server → Client

```json
{ "type": "connected", "clientId": "rt_..." }
{ "type": "subscribed", "channel": "posts.created" }
{ "type": "unsubscribed", "channel": "posts.created" }
{ "type": "event", "event": { "id", "type", "timestamp", "source", "payload" } }
{ "type": "error", "code": "invalid_channel", "message": "..." }
{ "type": "pong" }
```

Event shape matches `BakendEvent` from RFC-0000.

## Limits (V1)

- Max 50 subscriptions per connection
- No per-record channels
- No presence or typing indicators
- Single-process only (no Redis clustering)

## Future

- Handler priority tiers on Event Bus (logging → realtime → functions)
- Per-record subscriptions
- Horizontal scaling with shared pub/sub
- JavaScript/Dart SDK helpers (Milestone 11)

## Implementation (Milestone 9)

### Module Layout

```text
src/core/realtime/
  types.ts
  channel-matcher.ts
  permissions.ts
  create-realtime-engine.ts
```

### Endpoint

```http
WS /api/realtime
```

Same port as HTTP. Upgrade handled by `Bun.serve` in `create-server.ts`.

### Event Bus Integration

`eventBus.onAny()` receives every emitted event. The realtime engine matches subscriptions and fans out to connected clients.

`onAny` handlers run before type-specific handlers for low-latency delivery.

### Wiring

```text
start()
  ├── createEventBus()
  ├── createRealtimeEngine({ eventBus, collections, logger })
  └── createServer({ ..., realtime })
```

Shutdown order: `realtime.shutdown()` → `server.stop()`.

### Connection Data

Each WebSocket stores:

- `clientId` — `rt_{uuid}`
- `authContext` — `AuthContext | null`
- `subscriptions` — `Set<string>`

### Error Codes

| Code | Description |
|------|-------------|
| `invalid_json` | Message is not valid JSON |
| `invalid_action` | Unknown `action` field |
| `invalid_channel` | Channel name is empty or malformed |
| `subscription_limit` | Max subscriptions exceeded |
| `already_subscribed` | Duplicate subscribe (ignored or error) |

### V1 Non-Goals

- Per-record channels (`posts.rec_123`)
- Presence indicators
- Redis / multi-instance fan-out
- SDK client (Milestone 11)
