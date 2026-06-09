# RFC-0007 Storage System

Defines filesystem storage, upload flow, protected/public files, metadata storage, cleanup policies, and future cloud adapters.

## Purpose

Bakend stores uploaded files on the local filesystem with metadata in SQLite. Files can be public (downloadable without auth) or protected (owner or admin only).

## Goals

- Local filesystem storage (no S3 required for V1)
- Simple upload/download/delete API
- Public and protected file visibility
- Integration with collection `file` fields

## Upload Flow

1. Client authenticates (Bearer JWT)
2. Client POSTs multipart form to `/api/storage/upload`
3. Bakend writes bytes to `{storage}/files/{id}`
4. Bakend inserts metadata into `_files`
5. Bakend emits `storage.uploaded`
6. Client receives file metadata including `id`

## Access Control

| Operation | Rule |
|-----------|------|
| Upload | Authenticated user required |
| Download (public) | No auth required |
| Download (protected) | Owner (`user_id`) or `admin` role |
| Delete | Owner or `admin` |

## On-Disk Layout

```text
{config.storage}/
  files/
    {fileId}
```

Original filename and MIME type are stored in SQLite only (not in the path).

## Collection File Fields

Collection `file` fields store a file `id` string. Record validation checks that the ID exists in `_files`. Upload is a separate API call; no inline multipart on collection CRUD in V1.

## Events

- `storage.uploaded` — safe metadata payload (no disk path)
- `storage.deleted` — `{ id, userId }`

## Future

- S3 / Cloudflare R2 / Backblaze B2 adapters
- Image thumbnailing
- Orphan file cleanup on record delete
- Configurable max file size
- Anonymous public uploads

## Implementation (Milestone 8)

### Module Layout

```text
src/core/storage/
  types.ts
  file-store.ts
  filesystem.ts
  permissions.ts
  create-storage-engine.ts
```

### Database Table

Schema version `3`. Table `_files`:

- `id` TEXT PRIMARY KEY
- `filename` TEXT NOT NULL
- `mime_type` TEXT NOT NULL
- `size` INTEGER NOT NULL
- `visibility` TEXT NOT NULL (`public` | `protected`)
- `user_id` TEXT NOT NULL REFERENCES `_users(id)` ON DELETE CASCADE
- `created_at` TEXT NOT NULL

### Endpoints

```http
POST   /api/storage/upload
GET    /api/storage/:id
DELETE /api/storage/:id
```

### Upload Request

`multipart/form-data`:

- `file` (required) — the file bytes
- `visibility` (optional) — `public` or `protected`, default `protected`

### Response Shape

```json
{
  "id": "uuid",
  "filename": "photo.png",
  "mimeType": "image/png",
  "size": 12345,
  "visibility": "protected",
  "userId": "user-uuid",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

### Limits (V1)

- Max file size: 10 MB (hardcoded constant)
- Any MIME type accepted; empty files rejected

### Configuration

Uses existing `storage` path in `bakend.json` (default `./storage`). Env: `BAKEND_STORAGE`.

### Function and Job Context

```ts
storage: {
  get(id: string): Promise<FileMetadata | null>;
  delete(id: string): Promise<boolean>;
}
```

No upload from background context in V1.

### Wiring

`createStorageEngine()` in `start()`; HTTP handlers enforce ACL via `permissions.ts`; `createServer()` receives storage engine; collections validation receives `fileExists` lookup.
