# Realtime (LLM Reference)

WebSocket fan-out of Event Bus events to subscribed clients.

## Endpoint

```text
WS /api/realtime?token=<jwt>
```

## Client Protocol

```json
{ "action": "subscribe", "channel": "posts.created" }
{ "action": "unsubscribe", "channel": "posts.*" }
{ "action": "ping" }
```

Server frames: `connected`, `subscribed`, `unsubscribed`, `event`, `error`, `pong`.

## Channels

All Event Bus types are subscribable:

- `{collection}.created|updated|deleted` — wildcard `{collection}.*`
- `auth.login|logout|register`
- `storage.uploaded|deleted`
- `function.started|completed|failed`
- `job.started|completed|failed`
- `system.collection.created`

## Permission Filtering

Collection events filtered by collection `read` permission (same as REST).

## Module

```text
src/core/realtime/
  create-realtime-engine.ts
  channel-matcher.ts
  permissions.ts
  types.ts
```

Wired in `start()` via `eventBus.onAny()` fan-out.

## Limits

- 50 subscriptions per connection
- Single-process only

Full spec: `docs/api/websocket-api.md`
