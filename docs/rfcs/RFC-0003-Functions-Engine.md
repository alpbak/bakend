# RFC-0003 Functions Engine

## Purpose
Functions provide server-side business logic.

## Goals
- TypeScript-first
- Hot reload
- Event driven
- Simple deployment

## Structure

```text
functions/
  users/
    welcome.ts
```

## Function Context

```ts
export default async ({ db, auth, storage, logger }) => {}
```

## Triggers
- onCreate
- onUpdate
- onDelete
- onLogin
- onRegister

## Lifecycle
Event -> Event Bus -> Function Discovery -> Execution -> Logging

## Error Handling
Errors never crash Bakend.
Errors are logged and surfaced in dashboard.

## Development
`bak dev` watches and reloads functions automatically.

## Security
Functions execute with least privilege.
Future sandbox isolation may use worker-based execution.

## Future
- HTTP functions
- scheduled functions
- secrets management

## Implementation (Milestone 5)

### Module Layout

```text
src/core/functions/
  types.ts
  triggers.ts              # exported as bakend/functions
  trigger-registry.ts
  context.ts
  discover.ts
  create-functions-engine.ts
  watch.ts
```

### Trigger API

```ts
import { onCreate, onUpdate, onDelete } from "bakend/functions";

onCreate("posts", async ({ record, logger }) => {});
```

Triggers map to Event Bus types: `{collection}.created|updated|deleted`, `auth.login`, `auth.register`.

### Discovery

- Scans `functions/**/*.ts` relative to `bakend.json`
- Rewrites `bakend/functions` imports to the runtime triggers module
- Registers handlers on the Event Bus after each `load()`

### Lifecycle Events

The engine emits `function.started`, `function.completed`, and `function.failed`.

### Hot Reload

- `bak dev` starts with function watching enabled
- `bak start --watch` enables the same behavior
- `fs.watch` on `functions/` with debounced `reload()`

### Error Handling

Handler failures are caught, logged, and emitted as `function.failed`. Bakend continues running.
