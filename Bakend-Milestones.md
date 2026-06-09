# Bakend Milestones

# Purpose

This document defines the implementation roadmap for Bakend.

The goal is to prevent feature creep and maintain focus on the core mission:

> Bakend = PocketBase + Functions + Jobs

---

# MVP Definition

Bakend v0.1 MUST include:

- SQLite
- Collections
- Event Bus
- Functions
- Jobs

Everything else is optional.

---

# Milestone 0 — Project Foundation

Goal:

Create the initial repository structure.

Deliverables:

- Repository structure
- Documentation structure
- AGENTS.md
- RFCs
- Architecture documents
- CI/CD skeleton

Success Criteria:

Repository is ready for implementation.

---

# Milestone 1 — Core Runtime

Goal:

Create the Bakend executable.

Command:

```bash
bak start
```

Deliverables:

- Bun runtime
- Configuration loader
- SQLite initialization
- HTTP server
- Logging system

Startup Output:

```text
Bakend v0.1

Database: ready
API: ready

Listening on :8080
```

Success Criteria:

Bakend starts successfully.

---

# Milestone 2 — Event Bus

Goal:

Implement the Event Bus.

Deliverables:

- Event system
- Event registration
- Event publishing
- Event subscriptions

Example:

```ts
eventBus.emit("users.created")
```

Success Criteria:

Events can be emitted and consumed.

---

# Milestone 3 — Collections Engine

Goal:

Implement dynamic collections.

Deliverables:

- Collection definitions
- SQLite schema generation
- Collection metadata
- Validation engine

Example:

```json
{
  "name": "posts"
}
```

Success Criteria:

Collections can be created dynamically.

---

# Milestone 4 — CRUD API

Goal:

Generate REST APIs automatically.

Deliverables:

- Create
- Read
- Update
- Delete

Example:

```http
GET /api/posts
POST /api/posts
PUT /api/posts/:id
DELETE /api/posts/:id
```

Success Criteria:

CRUD works for all collections.

---

# Milestone 5 — Functions Engine

Goal:

Implement TypeScript functions.

Deliverables:

- Function discovery
- Function execution
- Trigger registration
- Hot reload

Example:

```ts
onCreate("posts", async ({ record }) => {
})
```

Success Criteria:

Functions execute on events.

---

# Milestone 6 — Jobs Engine

Goal:

Implement scheduled jobs.

Deliverables:

- Cron parser
- Scheduler
- Job execution
- Retry support
- Logging

Example:

```ts
export const schedule = "0 3 * * *"
```

Success Criteria:

Jobs run automatically.

---

# Milestone 7 — Authentication

Goal:

Implement user management.

Deliverables:

- User collection
- Registration
- Login
- JWT
- Sessions

Success Criteria:

Authenticated API access works.

---

# Milestone 8 — Storage

Goal:

Implement file storage.

Deliverables:

- Uploads
- Downloads
- Protected files
- Public files

Success Criteria:

Files can be managed through Bakend.

---

# Milestone 9 — Realtime

Goal:

Implement WebSocket subscriptions.

Deliverables:

- Realtime server
- Event subscriptions
- Collection subscriptions

Success Criteria:

Clients receive live updates.

---

# Milestone 10 — Dashboard

Goal:

Implement administration dashboard.

Technology:

SvelteKit

Deliverables:

- Collections management
- Users management
- Storage browser
- Functions viewer
- Jobs viewer
- Logs viewer

Success Criteria:

Most administration can be performed through UI.

---

# Milestone 11 — SDKs

Goal:

Create client SDKs.

Deliverables:

- JavaScript SDK
- TypeScript SDK
- Dart SDK

Success Criteria:

Applications can integrate without using raw APIs.

---

# Milestone 12 — Packaging

Goal:

Prepare production deployment.

Deliverables:

- Single executable build
- Docker image
- Systemd integration
- Upgrade process

Success Criteria:

Bakend deploys easily on VPS environments.

---

# Milestone 13 — Beta Release

Goal:

Public beta.

Deliverables:

- Documentation
- Examples
- Tutorials
- Website

Success Criteria:

External developers can build applications.

---

# Milestone 14 — Version 1.0

Goal:

Production-ready release.

Included:

- Database
- Collections
- Authentication
- Storage
- Realtime
- Functions
- Jobs
- Dashboard
- SDKs
- `bak init` and operator CLI (`migrate`, `backup`, `functions`, `jobs`)
- Hosted install script
- SDK publishing (npm, pub.dev)

Success Criteria:

Bakend delivers its full vision.

Status: **Complete** (v1.0.0 — 2026-06-09)

---

# Future Milestones

Potential post-1.0 milestones:

- Plugin system (RFC-0015)
- OAuth providers
- S3 / R2 adapters
- PostgreSQL adapter
- Monitoring / metrics system
- Persistent event log
- Per-record realtime channels
- Windows binary builds

These are intentionally deferred until after Version 1.0.
