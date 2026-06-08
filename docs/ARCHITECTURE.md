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

- Upload files
- Download files
- Access control

Storage structure:

```text
storage/
│
├── users/
├── products/
└── uploads/
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

Example:

```text
users:create
users:update
users:delete
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

Sections:

```text
Dashboard
Collections
Users
Files
Functions
Jobs
Logs
Settings
```

Dashboard communicates only through public APIs.

No direct database access.

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
