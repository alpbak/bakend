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

## Future
- computed fields
- soft deletes
- full-text search
