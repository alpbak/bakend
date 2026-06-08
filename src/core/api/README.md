# API

REST CRUD endpoints for collection records.

**Status:** Implemented (Milestone 4)

## Endpoints

| Method | Path | Handler |
|--------|------|---------|
| GET | `/api/:collection` | List records |
| POST | `/api/:collection` | Create record |
| GET | `/api/:collection/:id` | Read record |
| PUT | `/api/:collection/:id` | Update record |
| DELETE | `/api/:collection/:id` | Delete record |

Health routes (`/`, `/health`) are handled before API routing.

## Modules

| File | Purpose |
|------|---------|
| `types.ts` | Response and error types |
| `responses.ts` | JSON response helpers |
| `router.ts` | Route matching and dispatch |
| `handlers/records.ts` | CRUD handler functions |

## Wiring

```ts
createServer(config, logger, { collections, recordStore });
```

Called from `start()` after `createRecordStore()` and collection loading.

## Dependencies

- `CollectionsEngine` — collection existence checks, validation
- `RecordStore` — SQLite record CRUD

## Documentation

- User guide: `docs/user-guide/collections.md`
- API reference: `docs/api/rest-api.md`
