# Dashboard Demo

Demonstrates the Bakend admin dashboard at `/_/`.

## Setup

1. Build the dashboard from the repository root:

```bash
bun run dashboard:build
```

2. Set the admin bootstrap email and start Bakend:

```bash
export BAKEND_ADMIN_EMAIL=admin@example.com
bun run start -- --config examples/dashboard-demo/bakend.json
```

3. Open [http://localhost:8080/_/](http://localhost:8080/_/)

4. Register with `admin@example.com` (any password, minimum 8 characters). The first registration with the admin email receives the `admin` role.

## What to try

- Create and edit collection schemas under **Collections**
- Browse and CRUD `posts` records
- View users, upload files, inspect function triggers and jobs
- Tail recent server logs under **Logs**
