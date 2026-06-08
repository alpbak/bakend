# RFC-0004 Jobs Engine

## Purpose
Jobs execute background work on schedules.

## Goals
- No Redis
- Simple cron syntax
- Reliable execution

## Job Definition

```ts
export const schedule = "0 3 * * *";

export default async ({ db, logger }) => {}
```

## Scheduler
Built-in scheduler scans for due jobs.

## Execution Rules
- One execution per schedule
- Retry support
- Failure logging

## Logging
Each run records:
- start time
- end time
- status
- error

## Concurrency
Default: single process execution.
Future configurable concurrency.

## Future
- delayed jobs
- distributed execution
- queues
