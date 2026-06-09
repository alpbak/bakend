# Functions Demo

Demonstrates collection triggers with `onCreate`.

## Setup

From this directory:

```bash
bun run ../../src/index.ts start
```

## Workflow

```bash
# Create a post (triggers onCreate function)
curl -X POST http://localhost:8080/api/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hello","content":"World"}'
```

Check the server logs for:

```text
Post created: Hello
```

The function in `functions/posts/log-create.ts` runs automatically when a post is created.
