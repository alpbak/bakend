# Realtime

WebSocket subscriptions for live updates when records change or system events occur.

## Quick Start

1. Start Bakend:

```bash
bak start
```

2. Connect to the realtime endpoint:

```text
ws://localhost:8080/api/realtime
```

3. Subscribe to a channel:

```json
{ "action": "subscribe", "channel": "posts.created" }
```

4. Create or update a record via REST. The server pushes an event frame to subscribed clients.

See [examples/realtime-demo](../../examples/realtime-demo/) for a working demo with a browser client.

## Authentication

Anonymous connections work for public collections. For protected data, pass a JWT:

```text
ws://localhost:8080/api/realtime?token=<access_token>
```

Obtain a token via `POST /api/auth/login`. Browser WebSocket APIs cannot set custom headers, so the query parameter is the recommended approach.

## Subscribing

Send JSON text frames:

```json
{ "action": "subscribe", "channel": "posts.created" }
```

Unsubscribe:

```json
{ "action": "unsubscribe", "channel": "posts.created" }
```

Keep the connection alive:

```json
{ "action": "ping" }
```

## Channels

### Collection Events

Subscribe to create, update, or delete events for any collection:

```text
posts.created
posts.updated
posts.deleted
```

Use a wildcard to receive all CRUD events:

```text
posts.*
```

### Other Events

| Category | Channels |
|----------|----------|
| Auth | `auth.login`, `auth.logout`, `auth.register` |
| Storage | `storage.uploaded`, `storage.deleted` |
| Functions | `function.started`, `function.completed`, `function.failed` |
| Jobs | `job.started`, `job.completed`, `job.failed` |
| System | `system.collection.created` |

## Permission Filtering

Collection events respect the same `read` permission as the REST API. If a collection requires authentication or ownership to read records, realtime delivery follows the same rules.

Non-collection events use safe payloads and are delivered to all subscribers of that channel.

## Event Shape

Events match the internal Event Bus schema:

```json
{
  "type": "event",
  "event": {
    "id": "evt_123",
    "type": "posts.created",
    "timestamp": "2026-06-08T12:00:00.000Z",
    "source": "collections",
    "payload": { "id": "rec_1", "title": "Hello" }
  }
}
```

See [Events](./events.md) for the full event model.

## Limits

- Maximum 50 subscriptions per connection
- No per-record channels in v0.1
- Single-process deployment (no clustering)

## API Reference

Full protocol details: [WebSocket API](../api/websocket-api.md)
