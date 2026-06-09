# Jobs

Cron-based scheduler, job execution, retry support, and logging.

**Milestone:** 6 — Jobs Engine

## Module

- `types.ts` — `JobContext`, `JobsEngine`, `RegisteredJob`, `JobRunLog`
- `cron.ts` — 5-field cron parser and `getNextRun`
- `discover.ts` — scans `jobs/**/*.ts`
- `create-jobs-engine.ts` — scheduler, execution, retry, lifecycle events
- `watch.ts` — hot reload for `bak dev` / `bak start --watch`

Jobs are loaded from `jobs/` at startup. See `docs/user-guide/jobs.md` and `docs/rfcs/RFC-0004-Jobs-Engine.md`.
