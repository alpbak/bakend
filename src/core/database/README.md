# Database

SQLite engine for collections, migrations, queries, and indexes.

**Status:** Bootstrap implemented (Milestone 1). Collections metadata in Milestone 3.

## Tables

| Table | Purpose |
|-------|---------|
| `_bakend_meta` | Internal metadata (schema version) |
| `_collections` | Collection definitions (JSON) |
| `{collection}` | User-defined collection tables |
