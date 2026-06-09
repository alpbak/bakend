# Jobs

Cron-based scheduled background tasks that run automatically while Bakend is running.

**Milestone:** 6 — Jobs Engine

## Define a Job

Create a TypeScript file under `jobs/` next to `bakend.json`:

```ts
// jobs/cleanup.ts
export const schedule = "0 3 * * *";

export default async ({ db, logger }) => {
  logger.info("Running nightly cleanup");
};
```

Each file defines one job:

- `schedule` — required 5-field cron expression
- `default` export — async handler receiving `{ db, logger }`

## Cron Syntax

Five fields: `minute hour day month weekday`

```text
0 3 * * *     Every day at 03:00
*/5 * * * *   Every 5 minutes
0 9-17 * * 1-5  Weekdays, hourly from 09:00 to 17:00
```

| Field | Range |
|-------|-------|
| minute | 0–59 |
| hour | 0–23 |
| day | 1–31 |
| month | 1–12 |
| weekday | 0–6 (Sunday = 0) |

## Run Jobs

Jobs are loaded when Bakend starts:

```bash
bak start
```

Use development mode to reload job files without restarting:

```bash
bak dev
```

Or enable watch on start:

```bash
bak start --watch
```

## Retries

If a job handler throws, Bakend retries up to 3 times with a 5 second delay between attempts. After the final failure, the error is logged and Bakend keeps running.

## Monitoring

### Logs

Each run is logged. Failures include the job file path and error message.

### Lifecycle Events

The jobs engine emits Event Bus events:

- `job.started`
- `job.completed`
- `job.failed`

Subscribe from functions or future realtime clients to react to job outcomes.

### Run History

The engine keeps the last 50 runs per job in memory (`runId`, timestamps, status, attempt). Persistent history and a dashboard viewer are planned for later milestones.

## Overlap Behavior

Only one execution runs at a time per job. If a job is still running when the next schedule tick arrives, the overlapping tick is skipped.

## Example

See `examples/jobs-demo/` for a project with a heartbeat job that runs every minute.
