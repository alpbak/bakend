# Collections Engine (Milestone 3)

## Overview

Dynamic SQLite collections defined in JSON. Persists metadata, generates tables, validates records.

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

## File Loading

`collections/*.json` next to `bakend.json`, loaded alphabetically at startup via `loadCollectionDefinitions()`.

## Events

- `system.collection.created` — emitted on collection creation (`source: "collections"`)
- `{collection}.created|updated|deleted` — Milestone 4 (record CRUD)

## Module Layout

```text
src/core/collections/
├── types.ts
├── naming.ts
├── validate-definition.ts
├── generate-schema.ts
├── validate-record.ts
├── load-definitions.ts
└── create-collections-engine.ts
```

## Out of Scope (M3)

- REST CRUD endpoints
- Schema migration / alter / delete
- Auth permissions on collections
- File storage for `file` fields
