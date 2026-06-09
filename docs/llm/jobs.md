# Jobs Engine

Cron-based scheduled background tasks. Implemented in Milestone 6.

## Location

`src/core/jobs/`

- `types.ts` — `JobContext`, `JobsEngine`, `RegisteredJob`, `JobRunLog`
- `cron.ts` — hand-rolled 5-field cron parser and `getNextRun`
- `discover.ts` — scans `jobs/**/*.ts`, validates exports
- `create-jobs-engine.ts` — scheduler, execution, retry, lifecycle events
- `watch.ts` — `fs.watch` debounced reload for hot reload

## Job Definition

```ts
export const schedule = "0 3 * * *";

export default async ({ db, logger }) => {
  logger.info("Running cleanup");
};
```

- Path: `{projectRoot}/jobs/` (sibling to `bakend.json`)
- One job per `.ts` file
- Missing directory is skipped (no error)

## Cron Syntax

Five fields: `minute hour day month weekday`

| Field | Range |
|-------|-------|
| minute | 0–59 |
| hour | 0–23 |
| day | 1–31 |
| month | 1–12 |
| weekday | 0–6 (Sunday = 0) |

Supports `*`, `*/n`, ranges (`9-11`), and lists (`1,15`).

## Engine API

```ts
const jobs = createJobsEngine({
  eventBus, db, logger,
  jobsDir: join(projectDir, "jobs"),
  watch: false,
});
await jobs.load();
jobs.list();              // RegisteredJob[]
jobs.getRuns("cleanup");  // JobRunLog[] (in-memory, last 50)
jobs.reload();
jobs.shutdown();
```

Wired into `start()` via `StartResult.jobs`.

## Lifecycle Events

Emitted by the jobs engine (source: `jobs`):

- `job.started` — payload: `name`, `filePath`, `schedule`, `runId`
- `job.completed` — same + `durationMs`, `attempt`
- `job.failed` — same + `error`, `attempt`

## Retry Policy

- 3 attempts per scheduled run (1 initial + 2 retries)
- 5 second fixed delay between retries
- Failures never crash the process

## Scheduler

- One run at a time per job; overlapping ticks are skipped
- Uses `setTimeout` to next due time plus a 1s safety tick

## Hot Reload

- `bak dev` — starts with `watch: true` for functions and jobs
- `bak start --watch` — same behavior via flag
- Uses `fs.watch` with 100ms debounce

## Deferred

- `bak jobs` CLI management
- Persistent run history in SQLite
- Event-triggered jobs
- Distributed execution / queues
