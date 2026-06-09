# RFC-0016 Security Model

Defines Bakend security assumptions and production hardening guidance.

## Threat Model (v1.0)

Bakend targets single-tenant VPS deployment behind HTTPS reverse proxy (nginx, Caddy).

| Asset | Risk | Mitigation |
|---|---|---|
| JWT secret | Token forgery | Strong random secret; never commit to git |
| Admin account | Full data access | Set `BAKEND_ADMIN_EMAIL` before first registration |
| SQLite database | Data exfiltration | Filesystem permissions; backup encryption operator responsibility |
| Storage files | Unauthorized download | Protected vs public visibility; auth on upload |
| Functions/jobs | Arbitrary code execution | Only deploy trusted TypeScript; same trust as server code |

## Production Checklist

- Set `BAKEND_ENV=production` to warn on default JWT secrets
- Generate `auth.jwtSecret` via `bak init` or `openssl rand -hex 32`
- Terminate TLS at reverse proxy
- Restrict dashboard `/_/` to admin networks if needed
- Run `bak backup create` before upgrades
- Keep Bakend binary updated from signed GitHub releases

## Startup Warning

When `BAKEND_ENV=production` and `auth.jwtSecret` matches a known demo value, Bakend prints a warning on start.

## Non-Goals (post-1.0)

- OAuth / social login
- Rate limiting
- Audit log persistence
- mTLS between services

## Status

Implemented — Milestone 14
