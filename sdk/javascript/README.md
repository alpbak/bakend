# Bakend JavaScript / TypeScript SDK

Client library for authentication, CRUD, storage, and realtime.

**Milestone:** 11 — SDKs

## Usage

```ts
import { BakendClient } from "@bakend/client";

const client = new BakendClient("http://localhost:8080");

await client.auth.register({ email: "user@example.com", password: "password123" });

const posts = client.collection("posts");
const post = await posts.create({ title: "Hello" });
const all = await posts.list();
```

See [docs/sdk/javascript.md](../../docs/sdk/javascript.md) for full API reference.
