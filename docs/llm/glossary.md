# Glossary

## Collection

A dynamic database table with a schema defined in JSON. Bakend auto-generates CRUD APIs for each collection.

## Event Bus

The central event system. All subsystems publish and subscribe to events (e.g. `users.created`). Defined in RFC-0000.

## Function

A TypeScript module triggered by events (onCreate, onUpdate, onDelete, onLogin, onRegister). Lives in `functions/`.

## Job

A scheduled background task using cron syntax. Lives in `jobs/`.

## Record

A single row/document in a collection.

## Session

An authenticated user session backed by JWT access and refresh tokens.

## Role

Built-in permission levels: `admin`, `authenticated`, `public`.

## Migration

A schema change applied to the SQLite database via `bak migrate`.

## Realtime

WebSocket-based live updates when records change.

## SDK

Client library (JavaScript/TypeScript or Dart) for integrating with Bakend APIs.
