# Admin API

> Status: Implemented (Milestone 10)

Admin endpoints require a JWT with `role === "admin"`.

## Authentication

```http
GET /api/auth/me
```

Returns the current authenticated user. Used by the dashboard to verify admin access.

**Response:**

```json
{
  "user": {
    "id": "usr_...",
    "email": "admin@example.com",
    "role": "admin",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

## Collections

```http
GET    /api/admin/collections
POST   /api/admin/collections
GET    /api/admin/collections/:name
PUT    /api/admin/collections/:name
DELETE /api/admin/collections/:name
```

`POST` and `PUT` accept a collection definition:

```json
{
  "name": "posts",
  "fields": [
    { "name": "title", "type": "string", "required": true }
  ],
  "permissions": {
    "read": "public",
    "create": "authenticated"
  }
}
```

`PUT` runs inline schema migrations (add/remove/rename fields). Changing field types on existing columns is rejected.

## Users

```http
GET    /api/admin/users?limit=50&offset=0
PATCH  /api/admin/users/:id
DELETE /api/admin/users/:id
```

`PATCH` body:

```json
{ "role": "admin" }
```

Roles: `admin`, `authenticated`, `public`.

## Storage

```http
GET /api/admin/storage?limit=50&offset=0
```

Lists file metadata (same shape as upload response). Upload and delete use the public storage API.

## Functions

```http
GET /api/admin/functions
```

Returns registered triggers (metadata only, no handler code):

```json
{
  "items": [
    {
      "collection": "posts",
      "type": "create",
      "eventType": "posts.created",
      "filePath": "/path/to/functions/posts/handler.ts"
    }
  ]
}
```

## Jobs

```http
GET /api/admin/jobs
GET /api/admin/jobs/:name/runs
```

Job list returns `name`, `schedule`, and `filePath`. Runs return in-memory history (`runId`, `startedAt`, `endedAt`, `status`, `attempt`, optional `error`).

## Logs

```http
GET /api/admin/logs?limit=100&level=ERROR
```

Returns recent in-memory log entries (`timestamp`, `level`, `message`). Optional `level` filter: `DEBUG`, `INFO`, `WARN`, `ERROR`.

## Errors

| Status | Code | When |
|--------|------|------|
| 401 | `unauthorized` | Missing or invalid JWT |
| 403 | `forbidden` | Authenticated but not admin |
| 404 | `not_found` | Resource missing |
| 400 | `bad_request` | Validation or migration error |

## Admin record access

Users with `admin` role bypass collection `permissions` rules on public CRUD endpoints (`/api/:collection`), enabling full record management from the dashboard.
