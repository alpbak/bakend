# Storage API

> Status: Implemented (Milestone 8)

Base path: `/api/storage`

## POST /api/storage/upload

Upload a file. **Requires authentication.**

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | yes | File bytes |
| `visibility` | string | no | `public` or `protected` (default: `protected`) |

**Response `201`:**

```json
{
  "id": "fil_550e8400-e29b-41d4-a716-446655440000",
  "filename": "photo.png",
  "mimeType": "image/png",
  "size": 12345,
  "visibility": "protected",
  "userId": "usr_...",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

**Errors:**

| Status | Code | When |
|--------|------|------|
| 400 | `bad_request` | Missing file, empty file, or file exceeds 10 MB |
| 401 | `unauthorized` | No valid Bearer token |

## GET /api/storage/:id

Download a file by ID.

**Auth:** optional for public files; required for protected files (owner or admin).

**Response `200`:** file bytes with `Content-Type` and `Content-Disposition` headers.

**Errors:**

| Status | Code | When |
|--------|------|------|
| 401 | `unauthorized` | Protected file, no token |
| 403 | `forbidden` | Protected file, not owner/admin |
| 404 | `not_found` | Unknown file ID |

## DELETE /api/storage/:id

Delete a file. **Requires authentication** (owner or admin).

**Response `204`:** no body.

**Errors:**

| Status | Code | When |
|--------|------|------|
| 401 | `unauthorized` | No valid Bearer token |
| 403 | `forbidden` | Not owner or admin |
| 404 | `not_found` | Unknown file ID |

## Example

```bash
# Register and get token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r .token)

# Upload
curl -X POST http://localhost:8080/api/storage/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F 'file=@document.pdf' \
  -F 'visibility=public'

# Download (no auth for public files)
curl -O http://localhost:8080/api/storage/fil_...

# Delete
curl -X DELETE http://localhost:8080/api/storage/fil_... \
  -H "Authorization: Bearer $TOKEN"
```
