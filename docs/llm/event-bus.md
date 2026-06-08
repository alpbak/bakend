# Event Bus

Internal pub/sub system defined in RFC-0000. Implemented in Milestone 2.

## Location

`src/core/events/`

- `types.ts` — `BakendEvent`, `EventHandler`, `EventBus`
- `create-event-bus.ts` — `createEventBus(logger)`

## Schema

```ts
interface BakendEvent {
  id: string;        // evt_<uuid>
  type: string;      // e.g. "users.created"
  timestamp: string; // ISO-8601
  source: string;    // e.g. "collections", "system"
  payload: unknown;
}
```

## API

```ts
const eventBus = createEventBus(logger);

eventBus.on(type, handler);           // returns unsubscribe fn
eventBus.emit(type, { source?, payload? });
eventBus.flush();                     // await pending async handlers (tests)
```

## Rules

- Events are in-memory only (no persistence in v0.1)
- Every `emit()` logs at DEBUG
- Sync handlers run immediately; async handlers are fire-and-forget
- Handler errors are caught and logged at ERROR; never crash the process
- Exact type matching only (no wildcards in M2)
- Wired into `start()` via `StartResult.eventBus`

## Event Categories (RFC-0000)

- Collection: `{collection}.created|updated|deleted`
- Auth: `auth.login|logout|register|password_reset`
- Storage: `storage.uploaded|deleted`
- Function: `function.started|completed|failed`
- Job: `job.started|completed|failed`

## Deferred

- Wildcard subscriptions
- Handler priority tiers (logging → realtime → functions → plugins)
- Collection/function/job/realtime emitters and listeners
- Persistent event log
