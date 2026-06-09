# Authentication API

> Status: Implemented (Milestone 7)

Email/password authentication with JWT access tokens and refresh sessions.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account and session |
| POST | `/api/auth/login` | Authenticate and create session |
| POST | `/api/auth/refresh` | Rotate refresh token and issue new access token |
| POST | `/api/auth/logout` | Revoke refresh session |

## Register / Login

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response (`201` for register, `200` for login):

```json
{
  "token": "<access-jwt>",
  "refreshToken": "<opaque-refresh-token>",
  "user": {
    "id": "usr_550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "authenticated",
    "createdAt": "2026-06-09T12:00:00.000Z"
  }
}
```

`passwordHash` is never returned.

## Refresh / Logout

Request:

```json
{
  "refreshToken": "<opaque-refresh-token>"
}
```

Refresh returns the same shape as login. Logout returns `204 No Content`.

## Authenticated Requests

Send the access token on collection CRUD requests:

```http
Authorization: Bearer <access-jwt>
```

## Status Codes

| Code | When |
|------|------|
| 200 | Login or refresh succeeded |
| 201 | Registration succeeded |
| 204 | Logout succeeded |
| 400 | Invalid JSON or missing fields |
| 401 | Invalid credentials or token |
| 409 | Email already registered |

## Error Codes

| Code | Description |
|------|-------------|
| `unauthorized` | Invalid email/password or token |
| `conflict` | Duplicate email on register |
| `bad_request` | Invalid request body |

## Events

| Event | When | Payload |
|-------|------|---------|
| `auth.register` | Successful registration | Safe user object |
| `auth.login` | Successful login | Safe user object |
| `auth.logout` | Successful logout | `{ userId }` |

## Configuration

`bakend.json`:

```json
{
  "auth": {
    "jwtSecret": "change-me-in-production",
    "accessTokenTtl": "15m",
    "refreshTokenTtl": "7d"
  }
}
```

Environment overrides:

- `BAKEND_AUTH_JWT_SECRET`
- `BAKEND_ADMIN_EMAIL` — first registration with this email receives the `admin` role

## Example

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"password123"}'

curl -X POST http://localhost:8080/api/posts \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{"title":"Hello"}'
```

See [Authentication user guide](../user-guide/authentication.md) and [REST API](./rest-api.md) for collection permissions.
