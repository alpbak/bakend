# Bakend JavaScript / TypeScript SDK

Client library for authentication, CRUD, storage, and realtime against a [Bakend](https://alpbak.github.io/bakend/) server.

## Install

```bash
npm install @bakend/client
```

## Usage

```ts
import { BakendClient } from "@bakend/client";

const client = new BakendClient("http://localhost:8080");

await client.auth.register({ email: "user@example.com", password: "password123" });

const posts = client.collection("posts");
const post = await posts.create({ title: "Hello" });
const all = await posts.list();
```

## Documentation

- [JavaScript SDK guide](https://alpbak.github.io/bakend/docs/sdk/javascript/)
- [Bakend documentation](https://alpbak.github.io/bakend/docs/)

## License

MIT
