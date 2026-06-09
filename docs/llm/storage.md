# Storage (LLM Reference)

> Milestone 8 — implemented

## Module

`src/core/storage/` — `createStorageEngine()`, `_files` table, local filesystem at `{config.storage}/files/{id}`.

## API

```http
POST   /api/storage/upload   # multipart: file, visibility (public|protected)
GET    /api/storage/:id      # download
DELETE /api/storage/:id      # owner or admin
```

## ACL

| Operation | Rule |
|-----------|------|
| Upload | Authenticated |
| Download public | Anyone |
| Download protected | Owner or admin |
| Delete | Owner or admin |

## Collection `file` fields

Store file `id` string. Validation checks `_files.id` exists. Upload separately via storage API.

## Events

- `storage.uploaded` — metadata payload
- `storage.deleted` — `{ id, userId }`

## Context (functions/jobs)

```ts
storage.get(id: string): Promise<FileMetadata | null>
storage.delete(id: string): Promise<boolean>
```

## Limits

- Max file size: 10 MB (hardcoded)
- Schema version: 3 (`_files` table)

## Config

`bakend.json` → `storage` (default `./storage`). Env: `BAKEND_STORAGE`.
