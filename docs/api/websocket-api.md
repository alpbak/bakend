# WebSocket API

Realtime subscriptions over WebSocket.

**Endpoint:** `WS /api/realtime` (same host and port as HTTP)

## Connection

```text
ws://localhost:8080/api/realtime
ws://localhost:8080/api/realtime?token=<access_token>
```

Authentication is optional. Pass a JWT access token via:

- `Authorization: Bearer <token>` header on the upgrade request
- `?token=<token>` query parameter (recommended for browsers)

On connect, the server sends:

```json
{
  "type": "connected",
  "clientId": "rt_550e8400-e29b-41d4-a716-446655440000"
}
```

## Client Messages

All messages are JSON text frames.

### Subscribe

```json
{
  "action": "subscribe",
  "channel": "posts.created"
}
```

Response:

```json
{
  "type": "subscribed",
  "channel": "posts.created"
}
```

### Unsubscribe

```json
{
  "action": "unsubscribe",
  "channel": "posts.created"
}
```

Response:

```json
{
  "type": "unsubscribed",
  "channel": "posts.created"
}
```

### Ping

```json
{
  "action": "ping"
}
```

Response:

```json
{
  "type": "pong"
}
```

## Server Messages

### Event

When a subscribed event is emitted on the Event Bus:

```json
{
  "type": "event",
  "event": {
    "id": "evt_123",
    "type": "posts.created",
    "timestamp": "2026-06-08T12:00:00.000Z",
    "source": "collections",
    "payload": {
      "id": "rec_1",
      "title": "Hello",
      "createdAt": "2026-06-08T12:00:00.000Z",
      "updatedAt": "2026-06-08T12:00:00.000Z"
    }
  }
}
```

### Error

```json
{
  "type": "error",
  "code": "invalid_channel",
  "message": "Channel name is required"
}
```

| Code | Description |
|------|-------------|
| `invalid_json` | Message is not valid JSON |
| `invalid_action` | Unknown action |
| `invalid_channel` | Channel name is empty or malformed |
| `subscription_limit` | More than 50 subscriptions per connection |

## Channels

### Collection Events

```text
{collection}.created
{collection}.updated
{collection}.deleted
```

Example: `posts.created`, `posts.updated`, `posts.deleted`

Collection events are filtered by the collection `read` permission. Clients only receive events for records they are allowed to read via REST.

### Wildcards

```text
{collection}.*
```

Example: `posts.*` matches `posts.created`, `posts.updated`, and `posts.deleted`.

### Auth Events

```text
auth.login
auth.logout
auth.register
```

### Storage Events

```text
storage.uploaded
storage.deleted
```

### Function Events

```text
function.started
function.completed
function.failed
```

### Job Events

```text
job.started
job.completed
job.failed
```

### System Events

```text
system.collection.created
```

## Example

```javascript
const ws = new WebSocket("ws://localhost:8080/api/realtime?token=YOUR_TOKEN");

ws.onopen = () => {
  ws.send(JSON.stringify({ action: "subscribe", channel: "posts.*" }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "event") {
    console.log(message.event.type, message.event.payload);
  }
};
```

Then create a post:

```bash
curl -X POST http://localhost:8080/api/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hello"}'
```

The WebSocket client receives a `posts.created` event.
