# ARCHITECTURE.md

# Bakend Architecture

Version: 0.1 Draft

---

# Philosophy

Bakend is designed around a single principle:

> One executable. One database. One admin panel.

Every architectural decision must preserve simplicity.

Bakend is not a distributed system.

Bakend is not a microservices platform.

Bakend is a self-contained backend runtime.

---

# High Level Architecture

```text
                    ┌─────────────┐
                    │   Admin UI  │
                    └──────┬──────┘
                           │
                           ▼

┌─────────────────────────────────────────────┐
│                 Bakend Core                 │
├─────────────────────────────────────────────┤
│                                             │
│ REST API                                    │
│ WebSocket Server                            │
│ Authentication                              │
│ Storage                                     │
│ Collections                                 │
│ Functions Engine                            │
│ Jobs Engine                                 │
│ Event Bus                                   │
│                                             │
└─────────────────────────────────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   SQLite    │
                    └─────────────┘
```

---

# Project Structure

```text
bakend/
│
├── src/
│   ├── index.ts
│   └── core/
│       ├── server/
│       ├── database/
│       ├── auth/
│       ├── storage/
│       ├── collections/
│       ├── functions/
│       ├── jobs/
│       ├── events/
│       └── config/
│
├── dashboard/
│
├── sdk/
│   ├── javascript/
│   └── dart/
│
├── examples/
│
├── scripts/
│
└── tests/
```

---

# Runtime Structure

```text
┌─────────────┐
│ CLI Startup │
└──────┬──────┘
       │
       ▼

Load Configuration

       │
       ▼

Open SQLite

       │
       ▼

Start Core Services

       │
       ├── REST API
       ├── WebSocket
       ├── Event Bus
       ├── Functions Engine
       └── Jobs Engine

       │
       ▼

Serve Requests
```

---

# Core Modules

## Config Manager

Responsibilities:

- Load configuration
- Validate configuration
- Environment overrides

Config file:

```json
{
  "port": 8080,
  "database": "./bakend.db",
  "storage": "./storage"
}
```

---

## Database Engine

Storage:

- SQLite

Responsibilities:

- Collections
- Migrations
- Queries
- Indexes

Future:

- PostgreSQL Adapter

---

## Collections Engine

Collections are dynamic database tables.

Example:

```text
Users
Posts
Comments
Products
```

Responsibilities:

- CRUD
- Validation
- Relations
- Indexes

---

## Authentication Engine

Responsibilities:

- User registration
- Login
- Session management
- JWT generation

Authentication flow:

```text
Register
     │
     ▼
Create User
     │
     ▼
Create Session
     │
     ▼
Return Token
```

---

## Storage Engine

Responsibilities:

- Upload files (authenticated)
- Download files (public or protected)
- Delete files (owner or admin)
- Metadata in SQLite (`_files` table)

On-disk layout:

```text
{config.storage}/
  files/
    {fileId}
```

Access control:

| Operation | Rule |
|-----------|------|
| Upload | Authenticated |
| Download (public) | Anyone |
| Download (protected) | Owner or admin |
| Delete | Owner or admin |

API:

```http
POST   /api/storage/upload
GET    /api/storage/:id
DELETE /api/storage/:id
```

---

## REST API Layer

Responsibilities:

- CRUD endpoints
- Authentication
- Filtering
- Pagination

Example:

```http
GET /api/users
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
```

---

## Realtime Engine

Protocol:

- WebSockets

Responsibilities:

- Collection updates
- User updates
- System events

Example channels:

```text
users.created
users.updated
users.deleted
users.*
```

---

# Event Bus

The Event Bus connects:

- Collections
- Functions
- Jobs
- Realtime

Example:

```text
Record Created
      │
      ▼
 Event Bus
      │
      ├── Function Trigger
      ├── Realtime Update
      └── Logging
```

---

# Functions Engine

Functions are TypeScript modules.

Directory:

```text
functions/
│
├── users/
│   └── welcome.ts
│
└── orders/
    └── process.ts
```

Example:

```ts
export default async ({ db, auth, storage }) => {
}
```

Triggers:

```ts
onCreate("users")
onUpdate("users")
onDelete("users")
onLogin("users")
```

Responsibilities:

- Load functions
- Execute functions
- Sandbox execution
- Hot reload

---

# Jobs Engine

Jobs are scheduled tasks.

Directory:

```text
jobs/
│
├── cleanup.ts
├── reports.ts
└── emails.ts
```

Example:

```ts
export const schedule = "0 3 * * *"

export default async ({ db }) => {
}
```

Responsibilities:

- Scheduler
- Retry logic
- Logging
- Monitoring

---

# Dashboard Architecture

Technology:

- SvelteKit

URL:

- Served at `/_/` (PocketBase-style)
- Health checks remain at `/` and `/health`

Sections:

```text
Dashboard
Collections
Users
Files
Functions
Jobs
Logs
```

Dashboard communicates only through HTTP APIs.

No direct database access.

## Admin API

Admin operations use `/api/admin/*` routes. All require JWT with `admin` role.

```http
GET/POST   /api/admin/collections
GET/PUT/DELETE /api/admin/collections/:name
GET        /api/admin/users
PATCH/DELETE /api/admin/users/:id
GET        /api/admin/storage
GET        /api/admin/functions
GET        /api/admin/jobs
GET        /api/admin/jobs/:name/runs
GET        /api/admin/logs
```

Login uses `POST /api/auth/login`. Session identity via `GET /api/auth/me`.

## Admin Permission Bypass

Users with `admin` role bypass collection `permissions` rules on public CRUD endpoints, enabling full record management from the dashboard.

## Static Assets

SvelteKit builds to `dashboard/build/`. The Bun server serves these files at `/_/*` with SPA fallback.

---

# SDK Architecture

Version 1:

```text
JavaScript SDK
Dart SDK
```

Responsibilities:

- Authentication
- CRUD
- Realtime
- Storage

Example:

```ts
const client = new BakendClient(url);
```

---

# Request Lifecycle

```text
HTTP Request
      │
      ▼

Authentication

      │
      ▼

Validation

      │
      ▼

Collection Engine

      │
      ▼

Database

      │
      ▼

Event Bus

      │
      ▼

Functions

      │
      ▼

Response
```

---

# Function Lifecycle

```text
Event Occurs
      │
      ▼

Event Bus

      │
      ▼

Find Trigger

      │
      ▼

Execute Function

      │
      ▼

Log Result
```

---

# Job Lifecycle

```text
Scheduler Tick
      │
      ▼

Find Due Jobs

      │
      ▼

Execute Job

      │
      ▼

Log Result

      │
      ▼

Schedule Next Run
```

---

# Security Model

Version 1:

- JWT Authentication
- Password Hashing
- Role-based permissions
- Protected storage

Future:

- OAuth
- MFA
- API Keys

---

# Logging

Log levels:

```text
DEBUG
INFO
WARN
ERROR
```

Outputs:

- Console
- Log files

Future:

- Dashboard viewer

---

# Packaging

Target:

Single executable.

Examples:

```bash
bak start
bak dev
bak migrate
```

Deployment:

```bash
./bak
```

No runtime dependencies required.

---

# Future Extensions

Planned extension points:

- Storage adapters
- Database adapters
- Authentication providers
- SDK generators

---

# Architectural Rule #1

Whenever a feature is proposed ask:

> Does this make Bakend simpler or more complicated?

If the answer is more complicated, the feature should probably wait.
