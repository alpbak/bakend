# Authentication (LLM Reference)

> Status: Implemented (Milestone 7)

## Endpoints

```http
POST /api/auth/register   { email, password }
POST /api/auth/login      { email, password }
POST /api/auth/refresh    { refreshToken }
POST /api/auth/logout     { refreshToken }
```

## Response

```json
{ "token": "<jwt>", "refreshToken": "<opaque>", "user": { "id", "email", "role", "createdAt" } }
```

## Protected CRUD

```http
Authorization: Bearer <token>
```

## Permissions (on collection JSON)

Rules: `public` (default), `authenticated`, `owner`, `admin`.

Owner rule requires `user_id` field; auto-set on create.

## Events

`auth.register`, `auth.login`, `auth.logout`

## Config

`auth.jwtSecret`, `auth.accessTokenTtl`, `auth.refreshTokenTtl` in `bakend.json`.

Env: `BAKEND_AUTH_JWT_SECRET`, `BAKEND_ADMIN_EMAIL`

## Module

`src/core/auth/create-auth-engine.ts` — wired in `start()` as `StartResult.auth`.
