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
  ├── server/       REST + WebSocket
  ├── database/     SQLite
  ├── collections/  Dynamic schemas + CRUD
  ├── events/       Event Bus
  ├── functions/    TypeScript triggers
  ├── jobs/         Cron scheduler
  ├── auth/         JWT + sessions
  └── storage/      Filesystem
        │
        ▼
     SQLite
```

## Event-Driven Flow

All subsystems communicate through the Event Bus (RFC-0000):

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
