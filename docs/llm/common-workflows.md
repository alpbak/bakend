# Common Workflows

## 1. Create and Start a Project

```bash
git clone https://github.com/alpbak/bakend.git
cd bakend
bun install
cp bakend.json.example bakend.json
bun run start
```

Server listens on `:8080`. SQLite database is created automatically.

Verify:

```bash
curl http://localhost:8080/health
```

## 2. Define a Collection

Create `collections/posts.json` next to `bakend.json`:

```json
{
  "name": "posts",
  "fields": [
    { "name": "title", "type": "string", "required": true },
    { "name": "content", "type": "text" }
  ]
}
```

Restart the server — the collection is loaded automatically.

Or create programmatically via `StartResult.collections.create(definition)`.

CRUD API available at `/api/posts` after Milestone 4.

## 3. Write a Function

> Planned — Milestone 5

```ts
// functions/posts/notify.ts
export default async ({ db, logger }) => {
  logger.info("Post created");
};
```

## 4. Write a Job

> Planned — Milestone 6

```ts
// jobs/cleanup.ts
export const schedule = "0 3 * * *";

export default async ({ db, logger }) => {
  logger.info("Running cleanup");
};
```

## 5. Authenticate a Client

> Planned — Milestone 7

```http
POST /api/auth/register
POST /api/auth/login
```

## 6. Subscribe to Realtime

> Planned — Milestone 9

Connect via WebSocket and subscribe to `posts.created` events.

## Development Reading Order

1. RFC-0000 (Event Bus)
2. RFC-0001 (Core Architecture)
3. RFC-0002 through RFC-0010
4. ARCHITECTURE.md
5. TECH-STACK.md
