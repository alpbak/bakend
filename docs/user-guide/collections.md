# Collections

> Status: Implemented (Milestone 3)

Collections are dynamic database tables defined in JSON. Bakend persists the schema, generates SQLite tables, and validates record data.

## Defining a Collection

### JSON files (recommended for local development)

Place one definition per file in `collections/` next to `bakend.json`:

```json
{
  "name": "posts",
  "fields": [
    { "name": "title", "type": "string", "required": true },
    { "name": "content", "type": "text" }
  ]
}
```

Files are loaded alphabetically on `bak start`. If a collection already exists with the same definition, it is skipped.

**Relations:** the target collection must be defined first. Name files so dependencies load first (e.g. `users.json` before `posts.json`).

### Programmatic API

```ts
const meta = collections.create({
  name: "posts",
  fields: [
    { name: "title", type: "string", required: true },
    { name: "content", type: "text" },
  ],
});
```

Available on `StartResult.collections` after `bak start`.

## Field Types

| Type | Description |
|------|-------------|
| `string` | Short text |
| `text` | Long text |
| `integer` | Whole number |
| `float` | Decimal number |
| `boolean` | `true` or `false` |
| `datetime` | ISO-8601 string |
| `json` | JSON object or array |
| `relation` | Reference to another collection (requires `collection` property) |
| `file` | File path/id placeholder (storage integration in Milestone 8) |

## System Fields

Every collection automatically includes:

- `id` — generated as `rec_<uuid>`
- `createdAt`
- `updatedAt`

You do not define these in your schema.

## Validation Rules

| Rule | Applies to | Description |
|------|------------|-------------|
| `required` | All types | Field must be present and non-empty on create |
| `min` | `string`, `text`, `integer`, `float` | Minimum length or value |
| `max` | `string`, `text`, `integer`, `float` | Maximum length or value |
| `regex` | `string`, `text` | Must match pattern |
| `unique` | All except `json` | Value must be unique in the collection |

Validate record data before insert/update:

```ts
const result = collections.validateRecord("posts", { title: "Hello" }, "create");
if (!result.valid) {
  console.log(result.errors);
}
```

## Naming Rules

- Collection and field names: `^[a-z][a-z0-9_]*$`
- Cannot start with `_`
- Cannot use reserved names (`_bakend_meta`, `_collections`, `id`, `createdAt`, `updatedAt`)

Field names are stored as snake_case columns in SQLite (e.g. `authorId` → `author_id`).

## Events

Creating a collection emits `system.collection.created` on the Event Bus.

Record-level events (`posts.created`, etc.) are available after Milestone 4 (CRUD API).

## What Is Not Available Yet

| Feature | Milestone |
|---------|-----------|
| REST CRUD (`GET/POST /api/posts`) | 4 |
| Schema changes / migrations | RFC-0012 |
| Collection permissions | 7 |
| File upload for `file` fields | 8 |
