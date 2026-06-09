# Auth Demo

Demonstrates Milestone 7 authentication with protected collection permissions.

## Setup

From this directory:

```bash
bun run ../../src/index.ts start
```

## Workflow

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"writer@example.com","password":"password123"}'

# Create a post (requires token)
curl -X POST http://localhost:8080/api/posts \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{"title":"Hello","content":"World"}'

# List posts (public read)
curl http://localhost:8080/api/posts

# Logout
curl -X POST http://localhost:8080/api/auth/logout \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"<refreshToken>"}'
```

The `onRegister` function in `functions/users/welcome.ts` logs a welcome message when a user registers.
