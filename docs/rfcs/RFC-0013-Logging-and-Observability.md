# RFC-0013 Logging and Observability

Defines server logging, file sinks, and operator visibility.

## Purpose

Operators need logs for debugging production issues. The dashboard shows a recent in-memory buffer; persistent logs support `tail -f` workflows.

## Goals (v1.0)

- In-memory ring buffer (500 entries) for dashboard `/logs`
- Optional `logFile` in `bakend.json` with append-only writes
- Simple size-based rotation (5 MB → `.1`, previous `.1` → `.2`)
- Env override: `BAKEND_LOG_FILE`

## Configuration

```json
{
  "logLevel": "INFO",
  "logFile": "./logs/bakend.log"
}
```

Paths in `logFile` are relative to `bakend.json`.

## Non-Goals

- Structured JSON logging
- Log aggregation (Loki, Datadog)
- Persistent event log store
- Metrics / Prometheus exporter

## Status

Implemented — Milestone 14
