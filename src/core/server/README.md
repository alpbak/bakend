# Server

HTTP server bootstrap for Bakend.

**Status:** Implemented (Milestones 1, 4)

## API

```ts
const server = createServer(config, logger, { collections, recordStore });
```

Returns `{ port, stop }`.

## Routing

Request handling is delegated to `src/core/api/router.ts`:

- Health: `/`, `/health`
- CRUD: `/api/{collection}`, `/api/{collection}/:id`

See `src/core/api/README.md` and `docs/api/rest-api.md`.

## Modules

| File | Purpose |
|------|---------|
| `create-server.ts` | Bun.serve bootstrap |
| `routes.ts` | Health endpoint handlers |
