# Authentication

> Status: Implemented (Milestone 7)

Bakend provides email/password authentication with JWT access tokens, refresh sessions, and collection-level permissions.

## Quick Start

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"password123"}'

# Use token on protected routes
curl http://localhost:8080/api/posts \
  -H 'Authorization: Bearer <token>'
```

## Users

Users are stored in a system-managed `_users` table. The `users` collection name is reserved — user accounts are created only through `/api/auth/register`.

User fields exposed via the API:

- `id`
- `email`
- `role` — `admin`, `authenticated`, or `public`
- `createdAt`

## Tokens

- **Access token** — short-lived JWT sent as `Authorization: Bearer <token>`
- **Refresh token** — opaque token used with `/api/auth/refresh` and `/api/auth/logout`

Refresh rotates the session: the old refresh token is invalidated when a new pair is issued.

## Admin Bootstrap

Set `BAKEND_ADMIN_EMAIL` before the first registration. The matching email receives the `admin` role automatically.

## Collection Permissions

Add an optional `permissions` block to `collections/*.json`:

```json
{
  "name": "posts",
  "fields": [
    { "name": "title", "type": "string", "required": true },
    { "name": "user_id", "type": "string" }
  ],
  "permissions": {
    "create": "authenticated",
    "read": "public",
    "update": "owner",
    "delete": "owner"
  }
}
```

### Permission Rules

| Rule | Meaning |
|------|---------|
| `public` | Anyone (default when omitted) |
| `authenticated` | Valid access token required |
| `owner` | Authenticated user must own the record |
| `admin` | User role must be `admin` |

When omitted, all operations default to `public` (preserves pre-M7 behavior).

### Owner Convention

Use a `user_id` field on collections that use the `owner` rule. On create, Bakend auto-sets `user_id` to the authenticated user's id when the field exists.

List requests with `read: owner` return only records owned by the current user.

## Function Triggers

```ts
import { onLogin, onRegister } from "bakend/functions";

onRegister("users", async ({ record, auth }) => {
  console.log("New user:", record.email);
});

onLogin("users", async ({ auth }) => {
  console.log("Login:", auth.user?.email);
});
```

## Configuration

```json
{
  "auth": {
    "jwtSecret": "change-me-in-production",
    "accessTokenTtl": "15m",
    "refreshTokenTtl": "7d"
  }
}
```

See [Authentication API](../api/auth.md) for the full API specification.
