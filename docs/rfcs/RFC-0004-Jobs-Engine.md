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

## Implementation (Milestone 6)

### Module Layout

```text
src/core/jobs/
  types.ts
  cron.ts
  discover.ts
  create-jobs-engine.ts
  watch.ts
```

### Job File Contract

- Scans `jobs/**/*.ts` relative to `bakend.json`
- Each `.ts` file defines one job:
  - `export const schedule: string` — required, 5-field cron (`minute hour day month weekday`)
  - `export default async (ctx: JobContext) => void` — required handler
- Missing `jobs/` directory is non-fatal (same as functions)
- No `bakend/jobs` import rewrite in V1

### JobContext

```ts
interface JobContext {
  db: Database;
  logger: Logger;
}
```

`auth` and `storage` are deferred until Milestones 7–8.

### Cron Parser

Hand-rolled 5-field parser (no external dependencies):

| Field | Range | Special |
|-------|-------|---------|
| minute | 0–59 | `*`, `*/n`, lists, ranges |
| hour | 0–23 | same |
| day | 1–31 | same |
| month | 1–12 | same |
| weekday | 0–6 (Sun=0) | same |

- `getNextRun(schedule, after: Date): Date` computes the next fire time
- Invalid expressions throw `JobsError` at discovery/load time
- V1 non-goals: seconds field, named months/days, time zones beyond server local time

### Scheduler

- On `load()`, discover all jobs and schedule each
- Uses `setTimeout` to the next earliest due time across all jobs, plus a 1s safety tick to recover from drift
- One run at a time per job: if a job is still running when due again, skip the overlapping tick
- On shutdown: clear all timers; do not kill a running handler mid-flight

### Retry Policy

- 3 attempts per scheduled run (1 initial + 2 retries)
- Fixed 5s delay between retries
- Retries are synchronous within the same scheduled invocation
- After final failure: log error, emit `job.failed`, Bakend continues running

### Lifecycle Events

The engine emits `job.started`, `job.completed`, and `job.failed`:

| Event | Payload |
|-------|---------|
| `job.started` | `name`, `filePath`, `schedule`, `runId` |
| `job.completed` | same + `durationMs`, `attempt` |
| `job.failed` | same + `error`, `attempt` |

`name` is the filename without extension (e.g. `cleanup` from `jobs/cleanup.ts`).

### Run Logging

In-memory ring buffer per job (last 50 runs) with: `runId`, `startedAt`, `endedAt`, `status` (`completed` | `failed`), `error?`, `attempt`. No SQLite table in V1.

### Engine API

```ts
interface JobsEngine {
  load(): Promise<void>;
  reload(): Promise<void>;
  list(): RegisteredJob[];
  getRuns(name: string): JobRunLog[];
  shutdown(): void;
}
```

### Hot Reload

- `watch.ts` — debounced `fs.watch` on `jobs/`
- Enabled when `watch: true` in engine options
- `bak dev` and `bak start --watch` enable watch for both functions and jobs

### Error Handling

Job handler failures are caught, logged, retried per policy, and emitted as `job.failed`. Bakend continues running.

### V1 Non-Goals

- `bak jobs` CLI
- Event-triggered jobs
- Persistent run history in SQLite
- Distributed execution / queues
