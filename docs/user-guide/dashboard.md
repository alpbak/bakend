# Dashboard

> Status: Implemented (Milestone 10)

Bakend includes a SvelteKit administration dashboard served at `/_/`.

## Build

From the repository root:

```bash
bun run dashboard:build
```

During development, run the dashboard dev server (proxies `/api` to Bakend):

```bash
bun run dashboard:dev
```

## Configuration

`bakend.json`:

```json
{
  "dashboard": {
    "enabled": true
  }
}
```

Env: `BAKEND_DASHBOARD_ENABLED=true|false`

If the build directory is missing, Bakend logs a warning and continues serving the API.

## Login

1. Set `BAKEND_ADMIN_EMAIL` before the first registration, or promote a user via the API.
2. Open `http://localhost:8080/_/`
3. Sign in with an admin account (`POST /api/auth/login`).

The dashboard stores the JWT in `sessionStorage`.

## Sections

| Section | Description |
|---------|-------------|
| Overview | Counts for collections, users, files, and jobs |
| Collections | Create, edit, and delete schemas; CRUD records |
| Users | List users, change roles, delete accounts |
| Storage | Upload, browse, and delete files |
| Functions | Read-only list of registered triggers |
| Jobs | Job schedules and recent run history |
| Logs | Tail recent server logs (in-memory buffer) |

## Schema changes

Editing a collection schema from the dashboard updates SQLite inline:

- Add, remove, or rename fields
- Update permissions without DDL
- Field type changes on existing columns are rejected

Schema edits are stored in the database only (not written back to `collections/*.json`).

## Example

See `examples/dashboard-demo/`.
