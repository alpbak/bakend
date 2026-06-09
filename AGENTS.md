# AGENTS.md

# Bakend Development Guidelines

## Mission

Bakend = PocketBase + Functions + Jobs

The simplest backend platform for building MVPs.

Core goals:

- Single executable deployment
- SQLite-first architecture
- TypeScript-first development
- Local-first development
- Event-driven architecture
- Excellent developer experience

---

# Repository Structure

```text
BAKEND/
├── AGENTS.md
└── docs/
    ├── README.md
    ├── ARCHITECTURE.md
    ├── TECH-STACK.md
    ├── user-guide/
    ├── api/
    ├── sdk/
    ├── llm/
    └── rfcs/
```

Future code structure:

```text
BAKEND/
├── AGENTS.md
├── docs/
├── src/
├── tests/
├── sdk/
├── dashboard/
├── examples/
└── scripts/
```

---

# Documentation Locations

RFC documents:
/docs/rfcs

Architecture documents:
/docs

User guides:
/docs/user-guide

API documentation:
/docs/api

SDK documentation:
/docs/sdk

AI/LLM documentation:
/docs/llm

AGENTS.md must remain at repository root.

RFC numbers are permanent and must never be reused.

---

# Documentation Policy

Bakend documentation is a first-class feature.

Documentation debt is technical debt.

A feature is not complete until documentation is updated.

Every feature must leave the documentation in a better state than before.

---

# Documentation Requirement

Whenever a feature is added, modified, or removed:

1. Update implementation
2. Update tests
3. Update documentation

All three are required.

Code changes without documentation updates are considered incomplete.

Documentation and tutorial changes under `docs/` and `tutorials/` are published to the website on merge to `main`. Verify the site builds (`cd website && bun run build`) when changing markdown that should appear on [GitHub Pages](https://alpbak.github.io/bakend/docs/).

---

# User Documentation Structure

User-facing documentation should live under:

docs/user-guide/
docs/api/
docs/sdk/
docs/llm/

Examples:

docs/user-guide/collections.md
docs/user-guide/functions.md
docs/user-guide/jobs.md

docs/api/rest-api.md
docs/api/websocket-api.md

docs/sdk/javascript.md
docs/sdk/dart.md

---

# LLM Documentation

The docs/llm directory exists specifically for AI agents.

Files inside docs/llm should provide:

- Product overview
- Architecture summary
- API summary
- CLI reference
- Glossary
- Common workflows

These documents should be concise and optimized for AI context windows.

---

# Mandatory Reading Order

1. RFC-0000 Event Bus and Execution Model
2. RFC-0001 Core Architecture
3. RFC-0002 through RFC-0010
4. ARCHITECTURE.md
5. TECH-STACK.md
6. README.md

---

# Documentation Hierarchy

RFCs
↓
ARCHITECTURE.md
↓
AGENTS.md
↓
TECH-STACK.md
↓
README.md
↓
Code Comments

RFC documents are authoritative.

---

# Event-Driven Architecture

Bakend is an event-driven platform.

Preferred flow:

Collection
↓
Event Bus
↓
Functions
Realtime
Jobs
Logging

Avoid direct subsystem coupling.

---

# Event Bus Rule

The Event Bus is a foundational architectural component.

Subsystems should not directly depend on one another when an event-driven solution is possible.

Before introducing direct subsystem coupling, contributors must justify why an event-based approach is insufficient.

---

# Architectural Guardrails

- Single executable deployment
- SQLite-first architecture
- TypeScript-first development
- Local-first experience
- Event-driven architecture
- Convention over configuration
- Simplicity over complexity

Bakend must remain understandable by a solo developer within 5 minutes.

---

# Dependency Rule

AI agents and contributors MUST NOT introduce:

- Redis
- RabbitMQ
- Kafka
- Kubernetes
- PostgreSQL as a required dependency
- Microservices

without an approved RFC and documented rationale.

Bakend must remain deployable as a single executable.

---

# Predictability Rule

Bakend favors explicit behavior over hidden behavior.

Avoid:

- Magic code generation
- Hidden side effects
- Implicit dependencies

Developers should be able to understand behavior by reading code and documentation.

---

# RFC Change Policy

Architectural changes must follow:

1. Update RFC
2. Update ARCHITECTURE.md
3. Update implementation

Never implement architectural changes before updating documentation.

---

# Technology Constraints

Current stack:

- Bun
- TypeScript
- SQLite
- SvelteKit

Changing core technologies requires an RFC update.

---

# Function Philosophy

Functions should be:

- Easy to write
- Easy to debug
- Hot reloadable

---

# Job Philosophy

Jobs should be:

- Simple
- Reliable
- Observable

---

# Performance Targets

Startup:
- Under 1 second

Memory:
- Less than 150 MB idle

Developer Experience:
- Project running in under 5 minutes

---

# Non Goals

Bakend is not trying to become:

- AWS
- Firebase
- Supabase
- Kubernetes
- Enterprise platform
- Workflow builder
- Distributed systems framework

---

# Feature Completion Checklist

A feature is considered complete only when:

- Implementation exists
- Tests exist
- User documentation exists
- API documentation exists (if applicable)
- SDK documentation exists (if applicable)
- Examples exist (if applicable)
- Changelog entry exists
- RFC updated (if architecture changed)

Missing documentation means the feature is incomplete.

---

# Reserved RFC Numbers

RFC-0011 Admin Dashboard
RFC-0012 Migration Engine
RFC-0013 Logging and Observability
RFC-0014 Backup and Restore
RFC-0015 Plugin System
RFC-0016 Security Model
RFC-0017 Testing Strategy
RFC-0018 Versioning and Upgrade Policy

---

# Long-Term Vision

A developer should be able to run:

curl -fsSL https://bakend.dev/install.sh | sh

bak init myapp

bak start

and immediately have:

- Database
- Authentication
- Storage
- Realtime
- Functions
- Jobs

running locally and ready for deployment.
