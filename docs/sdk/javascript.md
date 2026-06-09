# JavaScript / TypeScript SDK

> Status: Implemented (Milestone 11)

Client library for authentication, CRUD, storage, and realtime.

**Package:** `@bakend/client` (workspace-local; npm publishing in Milestone 13)

## Installation

From the Bakend monorepo:

```bash
bun install
```

Import in your app:

```ts
import { BakendClient } from "@bakend/client";
```

## Quick Start

```ts
import { BakendClient } from "@bakend/client";

const client = new BakendClient("http://localhost:8080");

await client.auth.register({
  email: "user@example.com",
  password: "password123",
});

const posts = client.collection("posts");
const post = await posts.create({ title: "Hello", content: "World" });
const all = await posts.list();
console.log(all);
```

## Authentication

```ts
await client.auth.register({ email, password });
await client.auth.login({ email, password });
await client.auth.refresh();
await client.auth.logout();
const user = await client.auth.getMe();

client.auth.token;        // current access JWT
client.auth.refreshToken; // current refresh token
```

### Browser token persistence

```ts
import {
  BakendClient,
  createLocalStorageAuthStore,
} from "@bakend/client";

const client = new BakendClient("http://localhost:8080", {
  authStore: createLocalStorageAuthStore(),
});
```

## Collections (CRUD)

```ts
const posts = client.collection("posts");

await posts.list();
await posts.get("rec_...");
await posts.create({ title: "Hello" });
await posts.update("rec_...", { title: "Updated" });
await posts.delete("rec_...");
```

## Storage

```ts
const file = new Blob(["hello"], { type: "text/plain" });
const metadata = await client.storage.upload(file, {
  visibility: "public",
  filename: "hello.txt",
});

const blob = await client.storage.download(metadata.id);
const url = client.storage.getDownloadUrl(metadata.id);
await client.storage.delete(metadata.id);
```

## Realtime

```ts
const off = client.realtime.subscribe("posts.*", (event) => {
  console.log(event.type, event.payload);
});

client.realtime.unsubscribe("posts.*");
client.realtime.disconnect();
```

## Errors

Failed API calls throw `BakendError`:

```ts
import { BakendError } from "@bakend/client";

try {
  await client.auth.login({ email, password });
} catch (error) {
  if (error instanceof BakendError) {
    console.log(error.code, error.status, error.message);
  }
}
```

## Configuration

```ts
const client = new BakendClient("http://localhost:8080", {
  autoRefresh: true, // retry once with refresh token on 401 (default)
});
```

## See Also

- [Dart SDK](./dart.md)
- [REST API](../api/rest-api.md)
- [Authentication API](../api/auth.md)
- [WebSocket API](../api/websocket-api.md)
- [Storage API](../api/storage.md)
- RFC-0009 SDK Design
