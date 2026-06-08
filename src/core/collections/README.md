# Collections

Dynamic collection definitions, SQLite schema generation, validation, record storage, and metadata.

**Status:** Implemented (Milestones 3–4)

## CollectionsEngine API

```ts
const collections = createCollectionsEngine({ db, logger, eventBus });

collections.create({ name: "posts", fields: [...] });
collections.get("posts");
collections.list();
collections.exists("posts");
collections.validateRecord("posts", { title: "Hello" }, "create");
```

## RecordStore API

```ts
const recordStore = createRecordStore({ db, collections, logger, eventBus });

recordStore.create("posts", { title: "Hello" });
recordStore.get("posts", "rec_...");
recordStore.list("posts");
recordStore.update("posts", "rec_...", { title: "Updated" });
recordStore.delete("posts", "rec_...");
```

## File Loading

`collections/*.json` next to `bakend.json` are loaded at startup.

## Modules

| File | Purpose |
|------|---------|
| `types.ts` | Types and constants |
| `naming.ts` | camelCase → snake_case column mapping |
| `validate-definition.ts` | Schema-level validation |
| `generate-schema.ts` | SQLite DDL generation |
| `validate-record.ts` | Record validation |
| `record-id.ts` | Record ID generation (`rec_<uuid>`) |
| `serialize-record.ts` | Row ↔ record serialization |
| `record-store.ts` | Record CRUD and events |
| `load-definitions.ts` | JSON file loader |
| `create-collections-engine.ts` | Public factory and API |

## REST API

Records are also accessible via `/api/{collection}` endpoints. See `docs/api/rest-api.md`.
