# Dashboard

SvelteKit administration UI for collections, users, storage, functions, jobs, and logs.

**Milestone:** 10 — Dashboard

## Development

```bash
# From repository root — start Bakend first on :8080
bun run dashboard:dev
```

Open [http://localhost:5173/_/](http://localhost:5173/_/) (Vite proxies `/api` to Bakend).

## Production build

```bash
bun run dashboard:build
```

Output is written to `dashboard/build/`. Bakend serves these files at `/_/` when `dashboard.enabled` is true.

See `docs/user-guide/dashboard.md` for setup and login.
