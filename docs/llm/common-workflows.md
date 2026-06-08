# Common Workflows

> Status: Planned — workflows become actionable as milestones ship.

## 1. Create and Start a Project

```bash
bak init myapp
cd myapp
bak start
```

Server listens on `:8080`. SQLite database created automatically.

## 2. Define a Collection

Create a collection definition (format TBD in Milestone 3):

```json
{
  "name": "posts",
  "fields": [
    { "name": "title", "type": "string", "required": true },
    { "name": "content", "type": "text" }
  ]
}
```

CRUD API available at `/api/posts` after Milestone 4.

## 3. Write a Function

```ts
// functions/posts/notify.ts
export default async ({ db, logger }) => {
  logger.info("Post created");
};
```

Register trigger:

```ts
onCreate("posts", handler);
```

## 4. Write a Job

```ts
// jobs/cleanup.ts
export const schedule = "0 3 * * *";

export default async ({ db, logger }) => {
  logger.info("Running cleanup");
};
```

## 5. Authenticate a Client

```http
POST /api/auth/register
POST /api/auth/login
```

Use returned JWT for subsequent API requests.

## 6. Subscribe to Realtime

Connect via WebSocket and subscribe to `posts.created` events.

## Development Reading Order

1. RFC-0000 (Event Bus)
2. RFC-0001 (Core Architecture)
3. RFC-0002 through RFC-0010
4. ARCHITECTURE.md
5. TECH-STACK.md
