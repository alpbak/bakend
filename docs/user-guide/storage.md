# Storage

> Status: Implemented (Milestone 8)

Bakend stores uploaded files on the local filesystem with metadata in SQLite. Files can be **public** (downloadable without auth) or **protected** (owner or admin only).

## Configuration

```json
{
  "storage": "./storage"
}
```

Env override: `BAKEND_STORAGE`

## Upload

Uploads require authentication. Send a multipart form request:

```bash
curl -X POST http://localhost:8080/api/storage/upload \
  -H 'Authorization: Bearer <token>' \
  -F 'file=@photo.png' \
  -F 'visibility=public'
```

Fields:

- `file` (required) — the file bytes
- `visibility` (optional) — `public` or `protected` (default: `protected`)

Response (`201`):

```json
{
  "id": "fil_...",
  "filename": "photo.png",
  "mimeType": "image/png",
  "size": 12345,
  "visibility": "public",
  "userId": "usr_...",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

Max file size: **10 MB** (V1 hardcoded limit).

## Download

```bash
curl http://localhost:8080/api/storage/fil_...
```

- **Public** files: no auth required
- **Protected** files: `Authorization: Bearer <token>` required (owner or admin)

## Delete

```bash
curl -X DELETE http://localhost:8080/api/storage/fil_... \
  -H 'Authorization: Bearer <token>'
```

Only the file owner or an admin can delete.

## Collection File Fields

Define a `file` field in your collection:

```json
{
  "name": "attachments",
  "fields": [
    { "name": "title", "type": "string", "required": true },
    { "name": "file_id", "type": "file", "required": true }
  ]
}
```

Workflow:

1. Upload via `POST /api/storage/upload`
2. Create a record referencing the returned `id` in the `file_id` field

Record validation checks that the file ID exists in `_files`. Deleting a record does not delete the file automatically.

Remove orphan files not referenced by any record:

```bash
bak storage prune
```

## Events

- `storage.uploaded` — metadata payload
- `storage.deleted` — `{ id, userId }`

## Functions and Jobs

```ts
export default async ({ storage }) => {
  const file = await storage.get("fil_...");
  await storage.delete("fil_...");
};
```

See [Functions](./functions.md) and [Jobs](./jobs.md).
