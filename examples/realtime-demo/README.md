# Realtime Demo

Subscribe to live collection events over WebSocket.

## Setup

From this directory:

```bash
bun run ../../src/index.ts start
```

From the repo root:

```bash
bun run start -- --config examples/realtime-demo/bakend.json
```

## Browser Client

Open `client.html` in a browser (or serve it with any static file server).

1. Click **Connect** — subscribes to `posts.*`
2. Click **Create Post** — triggers a `posts.created` event in the log

## curl

Subscribe manually with `websocat` or similar, then create a post:

```bash
# Terminal 1: connect (requires websocat)
websocat ws://localhost:8080/api/realtime

# After connecting, send:
{"action":"subscribe","channel":"posts.created"}

# Terminal 2: create a post
curl -X POST http://localhost:8080/api/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hello realtime"}'
```

## Authenticated Collections

For protected collections, pass a JWT:

```text
ws://localhost:8080/api/realtime?token=<access_token>
```

Obtain a token via `POST /api/auth/login`. See `examples/auth-demo/` for auth setup.

## SDK Alternative

The same flow using `@bakend/client` is demonstrated in `examples/sdk-demo/`. See `docs/sdk/javascript.md`.
