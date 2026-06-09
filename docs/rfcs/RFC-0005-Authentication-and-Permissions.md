# RFC-0005 Authentication and Permissions

## Purpose
Authentication identifies users.
Permissions control access.

## Authentication V1
- email/password
- JWT access tokens
- refresh tokens
- sessions

## Password Storage
Passwords are hashed.
Plain text passwords are never stored.

## User Collection
System-managed users collection.

Fields:
- id
- email
- passwordHash
- role
- createdAt

## Roles
Built-in:
- admin
- authenticated
- public

Future:
- custom roles

## Collection Permissions

Example:

```json
{
  "posts": {
    "create": "authenticated",
    "update": "owner",
    "delete": "owner",
    "read": "public"
  }
}
```

## Authorization Flow

Request
-> JWT Validation
-> Permission Check
-> Collection Access

## Future Authentication Providers
- Apple
- Google
- GitHub
- Microsoft

## Future Security Features
- MFA
- API keys
- service accounts
- audit logs

## Implementation (Milestone 7)

### Module Layout

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

### Database Tables

- `_users` — system user store (`id`, `email`, `password_hash`, `role`, `created_at`)
- `_sessions` — refresh token sessions (`id`, `user_id`, `refresh_token_hash`, `expires_at`, `created_at`)
- Schema version `2`

### Endpoints

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### Token Model

- Access token: HS256 JWT (`sub`, `role`, `exp`)
- Refresh token: opaque value stored hashed in `_sessions`
- Refresh rotates sessions; logout revokes the session row

### Password Hashing

`Bun.password` with bcrypt (cost 10).

### Collection Permissions

Optional `permissions` block on `CollectionDefinition`:

```json
{
  "permissions": {
    "create": "authenticated",
    "read": "public",
    "update": "owner",
    "delete": "owner"
  }
}
```

Default when omitted: all operations `public`.

### Owner Convention

Collections using the `owner` rule must define a `user_id` field (`string` or `relation` to `users`). On create, `user_id` is auto-set from the authenticated user when the field exists.

### Reserved Names

- Collection name `users` is reserved (system auth store)
- Relation fields may reference `users` without a user-defined collection

### Events

- `auth.register` — safe user payload
- `auth.login` — safe user payload
- `auth.logout` — `{ userId }`

### Configuration

```json
{
  "auth": {
    "jwtSecret": "dev-only-change-me",
    "accessTokenTtl": "15m",
    "refreshTokenTtl": "7d"
  }
}
```

Env: `BAKEND_AUTH_JWT_SECRET`, `BAKEND_ADMIN_EMAIL`

### Wiring

`createAuthEngine()` in `start()`; HTTP server resolves `Authorization: Bearer` on each request and enforces permissions in record handlers.
