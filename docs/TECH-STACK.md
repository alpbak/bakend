# Bakend Technical Stack

# Philosophy

Bakend is designed around one principle:

> One executable. One database. One admin panel. One deployment.

The goal is to provide PocketBase simplicity while adding first-class Functions and Jobs.

---

# Core Runtime

## Bun

Responsibilities:

- HTTP Server
- WebSocket Server
- Function Runtime
- Job Scheduler
- CLI Runtime
- Packaging into executable

Reasons:

- Native TypeScript support
- Fast startup
- Excellent developer experience
- Single executable compilation
- Modern tooling

---

# Programming Language

## TypeScript

Used for:

- Core platform
- Functions
- Jobs
- SDK generation
- Internal APIs

Example:

```ts
export default async ({ db, auth }) => {
    console.log("Hello Bakend");
}
```

---

# Database

## SQLite

Storage engine for Version 1.

Responsibilities:

- Collections
- Authentication
- Sessions
- Metadata
- Internal configuration

Reasons:

- Zero configuration
- Embedded
- Fast
- Backup friendly

Future:

- PostgreSQL support (optional)
- Read replicas

---

# API Layer

## REST API

Automatically generated APIs for collections.

Features:

- CRUD
- Authentication
- Pagination
- Filtering
- Sorting

---

## Realtime

WebSocket-based subscriptions.

Features:

- Collection subscriptions
- User subscriptions
- System events

---

# Authentication

Version 1:

- Email/password
- Sessions
- JWT

Future:

- Google
- Apple
- GitHub
- Microsoft

---

# Storage

Local filesystem storage.

Features:

- Uploads
- Downloads
- Public files
- Protected files

Future:

- S3
- Cloudflare R2
- Backblaze B2

---

# Functions Engine

Functions are TypeScript files.

Triggers:

- onCreate
- onUpdate
- onDelete
- onLogin
- onRegister

Development:

- Hot reload
- Automatic discovery

---

# Jobs Engine

Cron-based scheduler.

Features:

- Scheduled jobs
- Background jobs
- Retry support
- Logging

Future:

- Queues
- Delayed jobs
- Distributed workers

---

# Admin Dashboard

## SvelteKit

Features:

- Collection management
- User management
- Storage browser
- Function management
- Job management
- Logs

---

# SDKs

Version 1:

- JavaScript
- TypeScript
- Dart / Flutter

Future:

- Swift
- Kotlin
- Python

---

# Deployment

Supported:

- VPS
- Docker
- Cloud VM
- Self-hosted

Examples:

- Hetzner
- DigitalOcean
- Linode
- Vultr
- AWS EC2

---

# CLI

Executable:

```bash
bak
```

Examples:

```bash
bak init
bak start
bak dev
bak functions
bak jobs
bak migrate
```

---

# Future Features

Not planned for V1:

- Kubernetes
- Redis dependency
- Microservices
- Workflow builders
- Enterprise-only features

Focus remains:

> Simplicity first.
