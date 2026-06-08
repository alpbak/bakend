# Functions

TypeScript function discovery, execution, trigger registration, and hot reload.

**Milestone:** 5 — Functions Engine

## Quick Start

```ts
// functions/posts/notify.ts
import { onCreate } from "bakend/functions";

onCreate("posts", async ({ record, logger }) => {
  logger.info(`Created post: ${record.title}`);
});
```

Functions are loaded from `functions/` at startup. Use `bak dev` or `bak start --watch` for hot reload.

## Modules

| File | Purpose |
|------|---------|
| `types.ts` | Core types |
| `triggers.ts` | Public trigger API (`bakend/functions` export) |
| `trigger-registry.ts` | Per-discovery registration stack |
| `context.ts` | Builds `FunctionContext` from events |
| `discover.ts` | Scans and imports function files |
| `create-functions-engine.ts` | Engine factory |
| `watch.ts` | File watcher for hot reload |

See `docs/llm/functions.md` and `docs/user-guide/functions.md`.
