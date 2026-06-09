# Events

In-memory Event Bus connecting collections, functions, jobs, and realtime.

**Status:** Implemented (Milestone 2)

## API

```ts
import { createEventBus } from "./create-event-bus.ts";

const eventBus = createEventBus(logger);

eventBus.on("users.created", (event) => {
  console.log(event.type, event.payload);
});

eventBus.emit("users.created", {
  source: "collections",
  payload: { id: "user_1" },
});
```

## Scope (Milestone 2)

- `BakendEvent` schema per [RFC-0000](../../../docs/rfcs/RFC-0000-Event-Bus-and-Execution-Model.md)
- `on()` registration with unsubscribe
- `onAny()` receives every emitted event (used by realtime fan-out)
- `emit()` publishing (non-blocking for async handlers)
- Automatic DEBUG logging on every emitted event
- Isolated error handling (handler failures never crash the process)

## Deferred

- Event persistence
- Handler priority tiers (logging → realtime → functions → plugins)
