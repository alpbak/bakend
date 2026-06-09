# Collections Engine (Milestone 3–4)

## Overview

Dynamic SQLite collections defined in JSON. Persists metadata, generates tables, validates records, and exposes REST CRUD.

## Definition Shape

```json
{
  "name": "posts",
  "fields": [
    { "name": "title", "type": "string", "required": true, "min": 1, "max": 200 },
    { "name": "authorId", "type": "relation", "collection": "users" }
  ]
}
```

## Field Types

`string`, `text`, `integer`, `float`, `boolean`, `datetime`, `json`, `relation`, `file`

## System Fields (auto-added)

`id` (`rec_<uuid>`), `createdAt`, `updatedAt` — stored as `id`, `created_at`, `updated_at` in SQLite.

## Validation Rules

`required`, `min`, `max`, `regex`, `unique`

## Metadata Table

```sql
_collections (name, definition, created_at, updated_at)
```

## CollectionsEngine API

```ts
interface CollectionsEngine {
  create(definition: CollectionDefinition): CollectionMeta;
  get(name: string): CollectionMeta | null;
  list(): CollectionMeta[];
  exists(name: string): boolean;
  validateRecord(collection, data, mode: "create" | "update"): ValidationResult;
}
```

Factory: `createCollectionsEngine({ db, logger, eventBus })`

Wired in `start()` as `StartResult.collections`.

## RecordStore API (Milestone 4)

```ts
interface RecordStore {
  create(collection: string, data: Record<string, unknown>): Record<string, unknown>;
  get(collection: string, id: string): Record<string, unknown> | null;
  list(collection: string): Record<string, unknown>[];
  update(collection: string, id: string, data: Record<string, unknown>): Record<string, unknown>;
  delete(collection: string, id: string): boolean;
}
```

Factory: `createRecordStore({ db, collections, logger, eventBus })`

Wired in `start()` as `StartResult.recordStore`.

## REST API

```http
GET    /api/{collection}
POST   /api/{collection}
GET    /api/{collection}/:id
PUT    /api/{collection}/:id
DELETE /api/{collection}/:id
```

See `docs/api/rest-api.md`.

## File Loading

`collections/*.json` next to `bakend.json`, loaded alphabetically at startup via `loadCollectionDefinitions()`.

## Events

- `system.collection.created` — emitted on collection creation (`source: "collections"`)
- `{collection}.created|updated|deleted` — emitted on record CRUD (`source: "collections"`)

## Module Layout

```text
src/core/collections/
├── types.ts
├── naming.ts
├── validate-definition.ts
├── generate-schema.ts
├── validate-record.ts
├── record-id.ts
├── serialize-record.ts
├── record-store.ts
├── load-definitions.ts
└── create-collections-engine.ts

src/core/api/
├── types.ts
├── responses.ts
├── router.ts
└── handlers/records.ts
```

## Out of Scope

- Schema migration / alter / delete
- Auth permissions on collections (implemented — see authentication.md)
- File storage for `file` fields (implemented — see storage.md)
- Filtering, sorting, pagination
