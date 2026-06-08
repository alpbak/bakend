# Functions

TypeScript functions run in response to collection and auth events. They are event-driven, non-blocking, and hot-reloadable during development.

**Milestone:** 5 — Functions Engine

## Directory Layout

Place function files under `functions/` next to `bakend.json`:

```text
functions/
  posts/
    notify.ts
  users/
    welcome.ts
```

Bakend discovers all `**/*.ts` files recursively at startup.

## Writing a Function

Import trigger helpers from `bakend/functions`:

```ts
import { onCreate } from "bakend/functions";

onCreate("posts", async ({ record, logger }) => {
  logger.info(`New post: ${record.title}`);
});
```

## Triggers

| Helper | Event | Status |
|--------|-------|--------|
| `onCreate("posts", fn)` | `posts.created` | Implemented |
| `onUpdate("posts", fn)` | `posts.updated` | Implemented |
| `onDelete("posts", fn)` | `posts.deleted` | Implemented |
| `onLogin("users", fn)` | `auth.login` | Registered (events in Milestone 7) |
| `onRegister("users", fn)` | `auth.register` | Registered (events in Milestone 7) |

## Function Context

Handlers receive:

```ts
interface FunctionContext {
  event: BakendEvent;
  record: Record<string, unknown>;
  db: Database;
  logger: Logger;
}
```

`record` is extracted from `event.payload`. `auth` and `storage` are deferred to Milestones 7 and 8.

## Lifecycle Events

The functions engine emits:

- `function.started`
- `function.completed`
- `function.failed`

## Error Handling

Handler failures are logged and isolated. A failing function does not crash Bakend or block API responses.

## Hot Reload

During development, use:

```bash
bak dev
```

Or enable watching on start:

```bash
bak start --watch
```

When a file in `functions/` changes, Bakend reloads all triggers automatically.

## Example Workflow

1. Define a `posts` collection in `collections/posts.json`
2. Create `functions/posts/notify.ts` with an `onCreate` trigger
3. Run `bak dev`
4. `POST /api/posts` — the function runs after the record is saved

See [events.md](events.md) for the underlying event model.
