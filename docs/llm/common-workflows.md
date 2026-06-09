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

## 3. Use the REST API

With a `posts` collection defined, CRUD is available immediately:

```bash
# Create a record
curl -X POST http://localhost:8080/api/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hello","content":"World"}'

# List records
curl http://localhost:8080/api/posts

# Read one record
curl http://localhost:8080/api/posts/rec_<id>

# Update (partial)
curl -X PUT http://localhost:8080/api/posts/rec_<id> \
  -H 'Content-Type: application/json' \
  -d '{"title":"Updated"}'

# Delete
curl -X DELETE http://localhost:8080/api/posts/rec_<id>
```

See `docs/api/rest-api.md` for full API details.

## 4. Write a Function

Create `functions/posts/notify.ts`:

```ts
import { onCreate } from "bakend/functions";

onCreate("posts", async ({ record, logger }) => {
  logger.info(`Post created: ${record.title}`);
});
```

Run with hot reload:

```bash
bak dev
```

Creating a post via `POST /api/posts` triggers the function after the record is saved.

## 5. Write a Job

```ts
// jobs/cleanup.ts
export const schedule = "0 3 * * *";

export default async ({ db, logger }) => {
  logger.info("Running cleanup");
};
```

Jobs load at startup. Use `bak dev` or `bak start --watch` to reload job files without restarting.

## 6. Authenticate a Client

> Planned — Milestone 7

```http
POST /api/auth/register
POST /api/auth/login
```

## 7. Subscribe to Realtime

> Planned — Milestone 9

Connect via WebSocket and subscribe to `posts.created` events.

## Development Reading Order

1. RFC-0000 (Event Bus)
2. RFC-0001 (Core Architecture)
3. RFC-0002 through RFC-0010
4. ARCHITECTURE.md
5. TECH-STACK.md
