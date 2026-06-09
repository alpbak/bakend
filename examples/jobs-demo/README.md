# Jobs Demo

Demonstrates a scheduled heartbeat job that runs every minute.

## Setup

From this directory:

```bash
bun run ../../src/index.ts start
```

## Workflow

Watch the server logs. Every minute you should see:

```text
Heartbeat job ran
```

The job is defined in `jobs/heartbeat.ts` with schedule `*/1 * * * *`.
