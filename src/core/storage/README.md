# Storage Engine

Local filesystem storage with SQLite metadata.

## Module Layout

| File | Role |
|------|------|
| `types.ts` | Types, errors, `MAX_FILE_SIZE` |
| `file-store.ts` | `_files` table CRUD |
| `filesystem.ts` | On-disk read/write/delete |
| `permissions.ts` | Public/protected ACL checks |
| `create-storage-engine.ts` | Engine factory |

## On-Disk Layout

```text
{config.storage}/files/{fileId}
```

## API

- `POST /api/storage/upload` — authenticated multipart upload
- `GET /api/storage/:id` — download (ACL enforced)
- `DELETE /api/storage/:id` — owner or admin

## Events

- `storage.uploaded`
- `storage.deleted`
