# Bakend

**The backend that gets out of your way.**

Bakend is an open-source backend platform designed for developers who want to build and launch products quickly without the complexity of cloud platforms, infrastructure management, or dozens of external services.

Inspired by the simplicity of PocketBase and the developer experience of Firebase, Bakend combines a database, authentication, storage, functions, and scheduled jobs into a single executable.

No cloud account.

No vendor lock-in.

No Kubernetes.

No Redis.

No DevOps degree required.

Download. Run. Build.

---

# Why Bakend?

Bakend = PocketBase + Functions + Jobs

Modern backend development has become unnecessarily complicated.

A simple MVP often requires:

- Database
- Authentication
- File Storage
- API Server
- Realtime Layer
- Cloud Functions
- Cron Jobs
- Background Workers
- Hosting Configuration

Developers end up stitching together multiple services and spending more time configuring infrastructure than building products.

Bakend exists to solve that problem.

> One executable. One database. One admin panel. Everything you need to launch an MVP.

---

# Core Principles

## Simplicity First

Every feature must pass a simple test:

> Can a developer get this running in under 5 minutes?

## Local First

Bakend runs on your machine. No cloud account is required.

## Single Binary

Bakend ships as a single executable.

```bash
bak start
```

## TypeScript Everywhere

Functions and jobs are written in TypeScript.

---

# Core Features

## Database

Embedded SQLite database.

## Authentication

Built-in authentication system.

Future:
- Google
- Apple
- GitHub
- Microsoft

## Storage

Built-in file storage.

## REST API

Automatic REST APIs for every collection.

## Realtime

Built-in WebSocket support.

## Functions

Server-side TypeScript functions and triggers.

## Jobs

Built-in scheduled jobs using cron syntax.

---

# Technology Stack

## Core Runtime

**Bun + TypeScript**

## Database

**SQLite**

## Admin Dashboard

**SvelteKit**

## API Layer

- REST
- WebSockets
- JSON

## SDKs

### Initial
- JavaScript / TypeScript
- Dart / Flutter

### Future
- Swift
- Kotlin
- Python

---

# Deployment

Designed for:
- VPS
- Docker
- Cloud VMs
- Self-hosted servers

---

# Roadmap

## Version 0.1 — Foundation
- SQLite
- Collections
- CRUD API
- Admin Dashboard
- Authentication
- File Storage

## Version 0.2 — Realtime
- WebSockets
- Realtime subscriptions
- Event system

## Version 0.3 — Functions
- TypeScript Functions
- Event triggers
- Hot reload

## Version 0.4 — Jobs
- Cron jobs
- Scheduled tasks
- Background processing

## Version 0.5 — SDKs
- JavaScript SDK
- Flutter SDK

## Version 0.6 — Production Ready
- Backup system
- Monitoring
- Logging
- User roles
- Access control

## Version 1.0

Database. Authentication. Storage. Realtime. Functions. Jobs. SDKs. Admin Dashboard.

---

# Vision

Bakend is not trying to replace enterprise cloud platforms.

The goal is simple:

> Spend less time configuring infrastructure and more time shipping software.
