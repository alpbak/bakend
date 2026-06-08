# API Summary

> Status: Planned — endpoints will be implemented across Milestones 4, 7, 8, and 9.

## REST API (Milestone 4)

Auto-generated CRUD per collection:

```http
GET    /api/{collection}
POST   /api/{collection}
GET    /api/{collection}/:id
PUT    /api/{collection}/:id
DELETE /api/{collection}/:id
```

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

JSON with consistent error structure. Full specification in `docs/api/` when implemented.
