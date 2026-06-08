# API Summary

> Status: CRUD implemented (Milestone 4). Auth, storage, and realtime planned for later milestones.

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

## Authentication (Milestone 7)

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

## Storage (Milestone 8)

```http
POST   /api/storage/upload
GET    /api/storage/:id
DELETE /api/storage/:id
```

## WebSocket (Milestone 9)

Connect to `/api/realtime` and subscribe to channels:

- `{collection}.created`
- `{collection}.updated`
- `{collection}.deleted`
- `auth.login`
- System events

## Response Format

JSON with consistent error structure. See `docs/api/rest-api.md` for details.
