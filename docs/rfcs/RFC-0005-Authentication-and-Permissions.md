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
