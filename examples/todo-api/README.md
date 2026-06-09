# Todo API

A minimal multi-feature Bakend project: authenticated CRUD, owner permissions, and a collection trigger.

Used by [Tutorial 01: Build a Todo API](../../tutorials/01-todo-api.md).

## Setup

From this directory:

```bash
bun run ../../src/index.ts start
```

## Quick test

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"password123"}'

# Create a todo (use accessToken from register response)
curl -X POST http://localhost:8080/api/todos \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <accessToken>' \
  -d '{"title":"Buy milk","completed":false}'

# List your todos
curl http://localhost:8080/api/todos \
  -H 'Authorization: Bearer <accessToken>'
```

Open the admin dashboard at [http://localhost:8080/_/](http://localhost:8080/_/) to browse todos.
