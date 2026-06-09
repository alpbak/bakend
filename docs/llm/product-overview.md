# Product Overview

## What is Bakend?

Bakend is an open-source backend platform designed for developers who want to build and launch products quickly without the complexity of modern cloud platforms.

Bakend combines:

- Database
- Authentication
- Storage
- Realtime
- Functions
- Jobs

into a single executable.

The project philosophy is:

> One executable. One database. One admin panel.

No cloud account.
No vendor lock-in.
No Kubernetes.
No Redis.
No DevOps degree required.

---

# Positioning

Bakend = PocketBase + Functions + Jobs

Bakend is not trying to compete with AWS, Firebase, or Supabase feature-for-feature.

Instead, it focuses on providing the fastest path from idea to working product.

Target users:

- Indie hackers
- Solo developers
- Startups
- MVP builders
- Internal tools teams
- Flutter developers
- Web developers

---

# Core Principles

## Simplicity First

Every feature must be understandable within minutes.

If a feature adds significant complexity, it should be questioned.

## Local First

Bakend runs locally without requiring cloud services.

Development and production share the same runtime.

## Single Executable

The entire platform is deployed as a single executable.

Example:

```bash
bak start
```

## TypeScript First

Functions and jobs are written in TypeScript.

Developers should not need to learn a custom language.

## Event Driven

Subsystems communicate through an internal Event Bus.

The Event Bus is a core architectural component.

---

# Core Features

## Collections

Dynamic database collections.

Automatically generates CRUD APIs.

Built on SQLite.

## Authentication

Built-in user management.

Version 1:

- Email/password
- JWT
- Sessions

Future:

- Google
- Apple
- GitHub
- Microsoft

## Storage

Built-in file storage.

Supports:

- Public files
- Protected files

Future:

- S3
- Cloudflare R2
- Backblaze B2

## Realtime

WebSocket-based subscriptions.

Receive updates when records change.

## Functions

TypeScript server-side logic.

Example:

```ts
export default async ({ db, auth, storage }) => {
}
```

Supported triggers:

- onCreate
- onUpdate
- onDelete
- onLogin
- onRegister

## Jobs

Cron-based scheduled tasks.

Example:

```ts
export const schedule = "0 3 * * *"

export default async () => {
}
```

---

# Technology Stack

Runtime:
- Bun

Language:
- TypeScript

Database:
- SQLite

Dashboard:
- SvelteKit

Protocols:
- REST
- WebSockets

---

# Why Bakend Exists

Modern MVP development often requires many separate services:

- Database
- Authentication
- Storage
- Realtime
- Background jobs
- Serverless functions

Developers spend more time integrating infrastructure than building products.

Bakend exists to reduce that complexity.

---

# Non Goals

Bakend is not:

- AWS
- Firebase
- Supabase
- Kubernetes
- Microservices framework
- Workflow automation platform

Bakend intentionally focuses on simplicity.

---

# Typical Workflow

Install:

```bash
curl -fsSL https://alpbak.github.io/bakend/install.sh | sh
```

Create project:

```bash
bak init myapp
```

Start:

```bash
bak start
```

Create collections.

Write functions.

Write jobs.

Ship product.

---

# Long-Term Vision

A developer should be able to launch a production-ready MVP in hours instead of days.

Bakend aims to become the simplest backend platform available for modern application development.

The success metric is simple:

> Spend less time configuring infrastructure and more time shipping software.
