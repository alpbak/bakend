# SDK Demo

Demonstrates the `@bakend/client` SDK for auth, CRUD, storage, and realtime.

## Setup

From the repo root, start Bakend with this example config:

```bash
bun run start -- --config examples/sdk-demo/bakend.json
```

In another terminal, run the demo:

```bash
bun run examples/sdk-demo/demo.ts
```

Optional: set a custom server URL:

```bash
BAKEND_URL=http://localhost:8080 bun run examples/sdk-demo/demo.ts
```

## What It Does

1. Subscribes to `posts.*` via realtime
2. Creates a post via `client.collection("posts")`
3. Registers a user via `client.auth.register`
4. Uploads, downloads, and deletes a file via `client.storage`

## See Also

- [JavaScript SDK docs](../../docs/sdk/javascript.md)
- [Dart SDK docs](../../docs/sdk/dart.md)
- [Realtime demo](../realtime-demo/) — raw WebSocket version
