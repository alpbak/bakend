# Functions Engine

TypeScript triggers on collection and auth events. Implemented in Milestone 5.

## Location

`src/core/functions/`

- `types.ts` — `FunctionContext`, `FunctionsEngine`, `RegisteredTrigger`
- `triggers.ts` — `onCreate`, `onUpdate`, `onDelete`, `onLogin`, `onRegister` (exported as `bakend/functions`)
- `trigger-registry.ts` — per-discovery trigger registration stack
- `discover.ts` — scans `functions/**/*.ts`, resolves `bakend/functions` imports
- `create-functions-engine.ts` — loads triggers, subscribes to Event Bus, emits lifecycle events
- `watch.ts` — `fs.watch` debounced reload for hot reload

## Trigger API

```ts
import { onCreate, onUpdate, onDelete } from "bakend/functions";

onCreate("posts", async ({ record, db, logger, event }) => {});
```

| Helper | Event type |
|--------|------------|
| `onCreate(collection, fn)` | `{collection}.created` |
| `onUpdate(collection, fn)` | `{collection}.updated` |
| `onDelete(collection, fn)` | `{collection}.deleted` |
| `onLogin(collection, fn)` | `auth.login` |
| `onRegister(collection, fn)` | `auth.register` |

## Discovery

- Path: `{projectRoot}/functions/` (sibling to `bakend.json`)
- Missing directory is skipped (no error)
- `bakend/functions` imports are rewritten to the runtime triggers module before import
- Transformed modules cached under `functions/.bakend-cache/`

## Engine API

```ts
const functions = createFunctionsEngine({
  eventBus, db, logger,
  functionsDir: join(projectDir, "functions"),
  watch: false,
});
await functions.load();
functions.list();   // RegisteredTrigger[]
functions.reload(); // re-discover and re-subscribe
functions.shutdown();
```

Wired into `start()` via `StartResult.functions`.

## Lifecycle Events

Emitted by the functions engine (source: `functions`):

- `function.started`
- `function.completed`
- `function.failed`

## Hot Reload

- `bak dev` — starts with `watch: true`
- `bak start --watch` — same behavior via flag
- Uses `fs.watch` with 100ms debounce

## Rules

- Functions subscribe via Event Bus only (never called from record-store directly)
- Handler errors never crash the process
- Same-process execution in M5 (no worker sandbox)
- `onLogin` / `onRegister` helpers exist; auth events arrive in Milestone 7

## Deferred

- HTTP functions, scheduled functions, secrets
- Worker sandbox isolation
- `bak functions` CLI management
- Dashboard functions viewer
