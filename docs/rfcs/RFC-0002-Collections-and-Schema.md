# RFC-0002 Collections and Schema

## Purpose
Collections are the primary abstraction in Bakend. Every user-defined data structure is represented as a collection.

## Design Goals
- Dynamic schema
- Automatic CRUD APIs
- SQLite-first
- Predictable migrations
- Relation support

## Collection Definition

```json
{
  "name": "posts",
  "fields": [
    {"name":"title","type":"string","required":true},
    {"name":"content","type":"text"},
    {"name":"authorId","type":"relation","collection":"users"}
  ]
}
```

## Supported Field Types
- string
- text
- integer
- float
- boolean
- datetime
- json
- relation
- file

## System Fields
Every collection automatically contains:
- id
- createdAt
- updatedAt

## Relations
Supported:
- one-to-one
- one-to-many

Many-to-many implemented through junction collections.

## Validation
- required
- min/max
- regex
- unique

## Indexes
Automatic:
- primary key
- relation indexes

Manual indexes supported.

## Migrations
Schema changes generate migrations.
Commands:
- bak migrate
- bak rollback

## API Generation
Collections automatically expose CRUD endpoints.

## Implementation

### Metadata Storage

Collection definitions are persisted in a `_collections` metadata table:

```sql
CREATE TABLE IF NOT EXISTS _collections (
  name TEXT PRIMARY KEY,
  definition TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

The `definition` column stores the full collection JSON. Bootstrap schema version is `1`.

### Reserved Names

Collection names must match `^[a-z][a-z0-9_]*$` and cannot:

- Start with `_`
- Collide with system tables (`_bakend_meta`, `_collections`)

Field names use the same pattern and cannot collide with system fields (`id`, `createdAt`, `updatedAt`).

### System Fields

Every user collection table automatically includes:

```sql
id TEXT PRIMARY KEY,
created_at TEXT NOT NULL,
updated_at TEXT NOT NULL
```

Record IDs are generated as `rec_<uuid>`.

### Field Type Mapping

| Field type | SQLite column | Notes |
|------------|---------------|-------|
| `string` | `TEXT` | |
| `text` | `TEXT` | |
| `integer` | `INTEGER` | |
| `float` | `REAL` | |
| `boolean` | `INTEGER` | 0 or 1 |
| `datetime` | `TEXT` | ISO-8601 |
| `json` | `TEXT` | JSON string |
| `relation` | `TEXT` | FK id; index auto-created |
| `file` | `TEXT` | Path/id placeholder until storage (Milestone 8) |

User-defined field names are stored as snake_case columns (e.g. `authorId` → `author_id`).

### Collection Creation

Collections can be created:

1. **Programmatically** — `CollectionsEngine.create(definition)`
2. **From files** — `collections/*.json` loaded at startup (relative to `bakend.json`)

On creation, Bakend emits `system.collection.created` with `source: "collections"`.

### Schema Changes

Altering or deleting collections is deferred to RFC-0012 (Migration Engine). Milestone 3 supports creation only.

## Future
- computed fields
- soft deletes
- full-text search
