# Tutorial 01: Build a Todo API

Build an authenticated todo API with owner-scoped records, a collection trigger, and the admin dashboard.

**Outcome:** Register a user, create todos, list only your todos, and see trigger logs when todos are created.

**Example project:** [examples/todo-api/](../examples/todo-api/)

## Prerequisites

- Bun installed
- Bakend repository cloned

## Step 1: Start the server

**Option A — use the bundled example:**

```bash
cd examples/todo-api
bun run ../../src/index.ts start
```

**Option B — scaffold your own project:**

```bash
bak init my-todos
cd my-todos
# copy collections and functions from examples/todo-api/
bak start
```

Expected output includes `Listening on :8080`.

Verify:

```bash
curl http://localhost:8080/health
```

## Step 2: Register a user

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"password123"}'
```

Save the `accessToken` from the JSON response.

## Step 3: Create todos

```bash
curl -X POST http://localhost:8080/api/todos \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <accessToken>' \
  -d '{"title":"Buy milk","completed":false}'
```

Create another:

```bash
curl -X POST http://localhost:8080/api/todos \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <accessToken>' \
  -d '{"title":"Walk the dog","completed":false}'
```

Check server logs for `Todo created: ...` from the `onCreate` function.

## Step 4: List your todos

```bash
curl http://localhost:8080/api/todos \
  -H 'Authorization: Bearer <accessToken>'
```

Only todos you own are returned (`read: owner` permission).

## Step 5: Mark a todo complete

Copy a todo `id` from the list response, then:

```bash
curl -X PUT http://localhost:8080/api/todos/<id> \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <accessToken>' \
  -d '{"completed":true}'
```

## Step 6: Browse in the dashboard

Open [http://localhost:8080/_/](http://localhost:8080/_/) and explore the `todos` collection.

## Verify it works

- [ ] `POST /api/auth/register` returns tokens
- [ ] `POST /api/todos` creates records with your token
- [ ] `GET /api/todos` returns only your todos
- [ ] Server logs show `Todo created:` messages
- [ ] Dashboard shows the `todos` collection

## What you built

| File | Purpose |
|------|---------|
| `collections/todos.json` | Schema and owner permissions |
| `functions/todos/on-create.ts` | Logs when a todo is created |
| `bakend.json` | Server config with JWT secret |

## Next steps

- [Authentication](../docs/user-guide/authentication.md)
- [Collections](../docs/user-guide/collections.md)
- [Tutorial 02: Add Realtime](02-realtime-app.md)
