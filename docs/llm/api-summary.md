# API Summary

> Status: CRUD (Milestone 4), Authentication (Milestone 7), Storage (Milestone 8), Realtime (Milestone 9), and Admin API (Milestone 10) implemented.

## REST API (Milestone 4)

Auto-generated CRUD per collection:

```http
GET    /api/{collection}
POST   /api/{collection}
GET    /api/{collection}/:id
PUT    /api/{collection}/:id
DELETE /api/{collection}/:id
```

Full specification: `docs/api/rest-api.md`

## Authentication (Milestone 7 — implemented)

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

## Storage (Milestone 8 — implemented)

```http
POST   /api/storage/upload   # multipart: file, visibility (public|protected)
GET    /api/storage/:id      # download (ACL enforced)
DELETE /api/storage/:id      # owner or admin
```

Upload response: `{ id, filename, mimeType, size, visibility, userId, createdAt }`

Full specification: `docs/api/storage.md`

## WebSocket (Milestone 9 — implemented)

```text
WS /api/realtime?token=<jwt>
```

Client messages: `{ "action": "subscribe"|"unsubscribe"|"ping", "channel": "..." }`

Channels (all Event Bus types):

- `{collection}.created|updated|deleted` (wildcard: `{collection}.*`)
- `auth.login|logout|register`
- `storage.uploaded|deleted`
- `function.started|completed|failed`
- `job.started|completed|failed`
- `system.collection.created`

Collection events are filtered by `read` permission. Full spec: `docs/api/websocket-api.md`

## Admin API (Milestone 10 — implemented)

Dashboard at `/_/`. Requires `admin` role.

```http
GET  /api/auth/me
GET  /api/admin/collections
POST /api/admin/collections
PUT  /api/admin/collections/:name
DELETE /api/admin/collections/:name
GET  /api/admin/users
PATCH /api/admin/users/:id
DELETE /api/admin/users/:id
GET  /api/admin/storage
GET  /api/admin/functions
GET  /api/admin/jobs
GET  /api/admin/jobs/:name/runs
GET  /api/admin/logs
```

Full specification: `docs/api/admin-api.md`

## Response Format

JSON with consistent error structure. See `docs/api/rest-api.md` for details.
