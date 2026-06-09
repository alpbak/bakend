# API Summary

> Status: CRUD (Milestone 4), Authentication (Milestone 7), and Storage (Milestone 8) implemented. Realtime planned for Milestone 9.

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

## WebSocket (Milestone 9)

Connect to `/api/realtime` and subscribe to channels:

- `{collection}.created`
- `{collection}.updated`
- `{collection}.deleted`
- `auth.login`
- System events

## Response Format

JSON with consistent error structure. See `docs/api/rest-api.md` for details.
