# Tutorial 02: Add Realtime

Subscribe to live collection events over WebSocket and see updates as records change.

**Outcome:** Connect a browser client, subscribe to `posts.*`, create a post, and see the event in real time.

**Example project:** [examples/realtime-demo/](../examples/realtime-demo/)

## Prerequisites

- Completed [Tutorial 01](01-todo-api.md) or familiarity with starting Bakend
- A modern browser

## Step 1: Start the realtime demo

```bash
cd examples/realtime-demo
bun run ../../src/index.ts start
```

## Step 2: Open the browser client

Open `examples/realtime-demo/client.html` in your browser.

1. Click **Connect** — subscribes to `posts.*`
2. Click **Create Post** — sends `POST /api/posts` and logs the `posts.created` event

You should see event payloads appear in the log panel.

## Step 3: Create a post with curl

In another terminal:

```bash
curl -X POST http://localhost:8080/api/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hello realtime","content":"Live update"}'
```

The browser client should receive a `posts.created` event.

## Step 4: Subscribe to a specific channel

Reconnect and send a narrower subscription. In the browser devtools console (after Connect), or with `websocat`:

```json
{"action":"subscribe","channel":"posts.created"}
```

Only create events are delivered.

## Verify it works

- [ ] WebSocket connects to `ws://localhost:8080/api/realtime`
- [ ] `posts.created` events appear when posts are created
- [ ] curl-created posts also trigger events

## Protocol reference

| Message | Purpose |
|---------|---------|
| `{"action":"subscribe","channel":"posts.*"}` | Subscribe to all post events |
| `{"action":"unsubscribe","channel":"posts.created"}` | Unsubscribe |

See [WebSocket API](../docs/api/websocket-api.md) for the full protocol.

## Next steps

- [Realtime user guide](../docs/user-guide/realtime.md)
- [SDK demo](../examples/sdk-demo/) for `@bakend/client` realtime
- [Tutorial 03: Deploy to a VPS](03-deploy-vps.md)
