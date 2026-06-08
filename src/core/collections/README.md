# Collections

Dynamic collection definitions, SQLite schema generation, validation, and metadata.

**Status:** Implemented (Milestone 3)

## API

```ts
const collections = createCollectionsEngine({ db, logger, eventBus });

collections.create({ name: "posts", fields: [...] });
collections.get("posts");
collections.list();
collections.exists("posts");
collections.validateRecord("posts", { title: "Hello" }, "create");
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
| `load-definitions.ts` | JSON file loader |
| `create-collections-engine.ts` | Public factory and API |
