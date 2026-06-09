# Auth

User registration, login, JWT generation, sessions, and permissions.

**Milestone:** 7 — Authentication

## Module Layout

```text
src/core/auth/
  types.ts
  password.ts
  jwt.ts
  duration.ts
  user-store.ts
  session-store.ts
  permissions.ts
  create-auth-engine.ts
```

## Wiring

`createAuthEngine()` is called from `start()` and passed to the HTTP server for auth routes and request context resolution.
