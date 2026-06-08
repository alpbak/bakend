# RFC-0000: Event Bus and Execution Model

Status: Draft
Version: 0.1

---

# Purpose

This RFC defines the Event Bus, which is the central nervous system of Bakend.

Every major subsystem communicates through events:

- Collections
- Authentication
- Functions
- Jobs
- Realtime
- Logging
- Future Plugins

If RFC-0001 defines the architecture, RFC-0000 defines how the architecture moves.

---

# Why an Event Bus?

Without an Event Bus:

```text
Collections
 ├─> Functions
 ├─> Realtime
 ├─> Logs
 └─> Jobs
```

Every subsystem depends on every other subsystem.

Complexity grows rapidly.

With an Event Bus:

```text
Collections
      │
      ▼
  Event Bus
      │
 ┌────┼────┐
 ▼    ▼    ▼
Functions
Realtime
Logs
Jobs
```

Each subsystem only needs to understand events.

---

# Core Principle

Everything important in Bakend produces an event.

Examples:

- User created
- User logged in
- Record updated
- File uploaded
- Job started
- Job failed
- Function completed

---

# Event Structure

All events share a common schema.

```ts
interface BakendEvent {
  id: string;
  type: string;
  timestamp: string;
  source: string;
  payload: unknown;
}
```

Example:

```json
{
  "id": "evt_123",
  "type": "users.created",
  "timestamp": "2026-06-08T12:00:00Z",
  "source": "collections",
  "payload": {
    "id": "user_1",
    "email": "john@example.com"
  }
}
```

---

# Event Categories

## Collection Events

```text
users.created
users.updated
users.deleted

posts.created
posts.updated
posts.deleted
```

---

## Authentication Events

```text
auth.login
auth.logout
auth.register
auth.password_reset
```

---

## Storage Events

```text
storage.uploaded
storage.deleted
```

---

## Function Events

```text
function.started
function.completed
function.failed
```

---

## Job Events

```text
job.started
job.completed
job.failed
```

---

# Event Flow

Example:

User created.

```text
POST /users
      │
      ▼

Collections Engine

      │
      ▼

SQLite Commit

      │
      ▼

users.created

      │
      ▼

Event Bus

      │
      ├─► Realtime
      ├─► Functions
      ├─► Logging
      └─► Future Plugins
```

---

# Execution Order

The Event Bus executes handlers in order.

1. Logging
2. Realtime
3. Functions
4. Plugins

This order may evolve later.

---

# Sync vs Async

## Synchronous Operations

Required operations:

```text
Request
 → Validation
 → Database
 → Response
```

These must complete before responding.

---

## Asynchronous Operations

Triggered through events:

```text
Welcome Email
Analytics
Notifications
Search Index Updates
```

These must never block API responses.

---

# Event Handlers

Each subsystem registers handlers.

Example:

```ts
eventBus.on("users.created", async (event) => {
});
```

---

# Functions Integration

Functions subscribe to events.

Example:

```ts
onCreate("users", async ({ record }) => {
});
```

Internally:

```text
users.created
      │
      ▼
Function Runtime
```

---

# Realtime Integration

Realtime subscriptions are event listeners.

Example:

```text
Client subscribed to:

users.*
```

When:

```text
users.created
```

is emitted, clients receive updates immediately.

---

# Jobs Integration

Jobs may emit events.

Example:

```text
job.started
job.completed
job.failed
```

Future jobs may subscribe to events.

Example:

```text
users.created
      │
      ▼
enqueue job
```

---

# Logging Integration

Every event is automatically logged.

Benefits:

- Debugging
- Monitoring
- Auditing

---

# Error Handling

Event failures must never crash Bakend.

Rule:

```text
Function Failed
       │
       ▼
Error Logged
       │
       ▼
Continue Processing
```

Event handlers are isolated.

---

# Event Persistence

V1:

Events are in-memory only.

Reason:

- Simplicity
- Performance

Future:

Optional persistent event log.

---

# Performance Goals

Event emission:

< 1 ms overhead

Event delivery:

Non-blocking

Memory:

Minimal allocations

---

# Future Plugin System

Plugins will consume events.

Example:

```text
users.created
      │
      ▼
Plugin
```

The Event Bus becomes the extension point for the entire platform.

---

# Architectural Rule

Whenever a new feature is proposed ask:

Can this be represented as an event?

If yes:

Use the Event Bus.

If no:

Reconsider the design.

---

# Vision

Bakend should eventually behave like a small operating system.

Subsystems should not know about each other.

They should only know about events.

The Event Bus is the heart of Bakend.

Everything flows through it.
