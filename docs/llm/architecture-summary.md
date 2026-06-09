# Architecture Summary

Bakend is a single-executable, SQLite-first backend runtime built with Bun and TypeScript.

## Core Principle

> One executable. One database. One admin panel.

## High-Level Layout

```text
Admin UI (SvelteKit)
        │
        ▼
Bakend Core (src/core/)
  ├── server/       HTTP server
  ├── api/          REST CRUD routing (Milestone 4 — implemented)
  ├── database/     SQLite
  ├── collections/  Dynamic schemas, validation, records (Milestones 3–4 — implemented)
  ├── events/       Event Bus (Milestone 2 — implemented)
  ├── functions/    TypeScript triggers (Milestone 5 — implemented)
  ├── jobs/         Cron scheduler
  ├── auth/         JWT + sessions (Milestone 7 — implemented)
  ├── storage/      Filesystem uploads (Milestone 8 — implemented)
  └── realtime/     WebSocket fan-out (Milestone 9 — implemented)
        │
        ▼
     SQLite
```

## Event-Driven Flow

The Event Bus is implemented (Milestone 2). All subsystems communicate through it (RFC-0000):

```text
Collection change → Event Bus → Functions / Realtime / Jobs / Logging
```

Subsystems must not couple directly when an event-based approach is sufficient.

## Request Lifecycle

```text
HTTP Request → Auth → Validation → Collection Engine → Database → Event Bus → Functions → Response
```

## Technology

- Runtime: Bun
- Language: TypeScript
- Database: SQLite
- Dashboard: SvelteKit

## Guardrails

- No Redis, RabbitMQ, Kafka, or Kubernetes as required dependencies
- No microservices — single process deployment
- Startup target: under 1 second
- Memory target: under 150 MB idle
