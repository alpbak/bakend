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
