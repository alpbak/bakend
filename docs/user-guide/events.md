# Events

Bakend uses an internal Event Bus so subsystems can communicate without direct coupling.

Every important action in Bakend produces an event. Examples:

- `users.created`
- `posts.updated`
- `auth.login`
- `job.completed`

See [RFC-0000](../rfcs/RFC-0000-Event-Bus-and-Execution-Model.md) for the full event model.

## Event Schema

All events share the same structure:

```json
{
  "id": "evt_123",
  "type": "users.created",
  "timestamp": "2026-06-08T12:00:00Z",
  "source": "collections",
  "payload": {
    "id": "user_1",
    "email": "john@example.com"
  }
}
```

| Field | Description |
|-------|-------------|
| `id` | Unique event identifier (`evt_` prefix) |
| `type` | Dot-separated event name |
| `timestamp` | ISO-8601 UTC time |
| `source` | Subsystem that emitted the event |
| `payload` | Event-specific data |

## Subscribing

```ts
const unsubscribe = eventBus.on("users.created", (event) => {
  console.log(event.payload);
});

unsubscribe();
```

Handlers may be synchronous or async. Async handlers do not block `emit()`.

## Publishing

```ts
eventBus.emit("users.created", {
  source: "collections",
  payload: { id: "user_1", email: "john@example.com" },
});
```

If `source` is omitted, it defaults to `"system"`.

## Error Handling

Handler failures are logged and isolated. A failing handler does not prevent other handlers from running, and does not crash Bakend.

## What Is Not Available Yet

| Feature | Milestone |
|---------|-----------|
| Collection schema events (`system.collection.created`) | 3 (implemented) |
| Record CRUD events (`users.created` on CRUD) | 4 |
| Function triggers (`onCreate("users")`) | 5 |
| Realtime WebSocket fan-out | 9 |
| Wildcard subscriptions (`users.*`) | 9 |
| Persistent event log | Post-1.0 |

The Event Bus is internal infrastructure. There is no public HTTP API for events in v0.1.
