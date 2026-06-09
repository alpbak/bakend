# REST API

> Status: Implemented (Milestone 4, permissions in Milestone 7)

Auto-generated CRUD endpoints for all collections.

## Endpoints

For every registered collection `{collection}`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/{collection}` | List records |
| POST | `/api/{collection}` | Create record |
| GET | `/api/{collection}/:id` | Read one record |
| PUT | `/api/{collection}/:id` | Update record (partial) |
| DELETE | `/api/{collection}/:id` | Delete record |

Health endpoints remain available at `/` and `/health`.

## Authentication

Protected collections require a valid JWT:

```http
Authorization: Bearer <access-token>
```

Obtain tokens via [Authentication API](./auth.md). The `users` collection is not exposed via CRUD — use auth endpoints instead.

## Request Format

- POST and PUT require `Content-Type: application/json`
- Request body must be a JSON object with field names matching the collection schema
- System fields (`id`, `createdAt`, `updatedAt`) are managed by Bakend — do not send them on create

## Response Format

### Single record

```json
{
  "id": "rec_550e8400-e29b-41d4-a716-446655440000",
  "title": "Hello",
  "createdAt": "2026-06-08T12:00:00.000Z",
  "updatedAt": "2026-06-08T12:00:00.000Z"
}
```

### List

```json
{
  "items": [
    {
      "id": "rec_550e8400-e29b-41d4-a716-446655440000",
      "title": "Hello",
      "createdAt": "2026-06-08T12:00:00.000Z",
      "updatedAt": "2026-06-08T12:00:00.000Z"
    }
  ]
}
```

Records are ordered by `createdAt` descending (newest first).

### Create

Returns `201 Created` with the created record.

### Delete

Returns `204 No Content` on success.

## Error Format

```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "rule": "required",
        "message": "Field \"title\" is required"
      }
    ]
  }
}
```

## Status Codes

| Code | When |
|------|------|
| 200 | Successful read, list, or update |
| 201 | Record created |
| 204 | Record deleted |
| 400 | Invalid JSON body or validation failure |
| 401 | Authentication required or invalid token |
| 403 | Authenticated but insufficient permissions |
| 404 | Unknown collection or record |
| 405 | Unsupported HTTP method |

## Error Codes

| Code | Description |
|------|-------------|
| `validation_error` | Record failed validation |
| `bad_request` | Invalid or missing JSON body |
| `unauthorized` | Missing or invalid authentication |
| `forbidden` | Insufficient permissions |
| `not_found` | Collection or record not found |
| `method_not_allowed` | HTTP method not supported for route |

## Example

```bash
# Create
curl -X POST http://localhost:8080/api/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hello","content":"World"}'

# List
curl http://localhost:8080/api/posts

# Read
curl http://localhost:8080/api/posts/rec_<id>

# Update (partial)
curl -X PUT http://localhost:8080/api/posts/rec_<id> \
  -H 'Content-Type: application/json' \
  -d '{"title":"Updated"}'

# Delete
curl -X DELETE http://localhost:8080/api/posts/rec_<id>
```

## Events

Successful CRUD operations emit Event Bus events:

- `{collection}.created` — full record in payload
- `{collection}.updated` — full updated record in payload
- `{collection}.deleted` — `{ id }` in payload

All record events use `source: "collections"`.

## Collection Permissions

Collections may define optional `permissions` in their JSON definition. Rules: `public`, `authenticated`, `owner`, `admin`. See [Authentication user guide](../user-guide/authentication.md).

## Not Available Yet

| Feature | Milestone |
|---------|-----------|
| Filtering, sorting, pagination | Post-M4 |
| Collection management via REST | Out of scope |
