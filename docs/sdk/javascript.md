# JavaScript / TypeScript SDK

> Status: Implemented (Milestone 11) · Published on npm (Milestone 14)

**Package:** `@bakend/client`

## Install

```bash
npm install @bakend/client
```

Workspace development (Bakend monorepo):

```bash
bun install
```

## Quick start

```ts
import { BakendClient } from "@bakend/client";

const client = new BakendClient({ baseUrl: "http://localhost:8080" });

await client.auth.register({ email: "you@example.com", password: "password123" });
const posts = client.collection("posts");
const record = await posts.create({ title: "Hello" });
```

## Modules

| Module | Methods |
|--------|---------|
| `auth` | `register`, `login`, `refresh`, `logout`, `getMe` |
| `collection(name)` | `create`, `get`, `list`, `update`, `delete` |
| `storage` | `upload`, `download`, `delete` |
| `realtime` | `subscribe`, `unsubscribe`, `disconnect` (auto-reconnect) |

## Realtime

```ts
const unsub = client.realtime.subscribe("posts.*", (event) => {
  console.log(event.type, event.payload);
});
```

## See also

- [SDK user guide](../user-guide/sdk.md)
- [RFC-0009 SDK Design](../rfcs/RFC-0009-SDK-Design.md)
