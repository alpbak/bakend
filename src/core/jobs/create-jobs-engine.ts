import type { Database } from "bun:sqlite";
import type { EventBus } from "../events/types.ts";
import type { Logger } from "../logging/logger.ts";
import { getNextRun } from "./cron.ts";
import { discoverJobs } from "./discover.ts";
import type { JobContext, JobRunLog, JobsEngine, RegisteredJob } from "./types.ts";
import { createJobsWatcher } from "./watch.ts";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;
const MAX_RUN_HISTORY = 50;
const SAFETY_TICK_MS = 1000;

export interface CreateJobsEngineOptions {
  eventBus: EventBus;
  db: Database;
  logger: Logger;
  jobsDir: string;
  watch?: boolean;
}

interface ScheduledJob {
  job: RegisteredJob;
  nextRun: Date;
  running: boolean;
}

function isPromise(value: unknown): value is Promise<unknown> {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as Promise<unknown>).then === "function"
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function createJobsEngine(options: CreateJobsEngineOptions): JobsEngine {
  const { eventBus, db, logger, jobsDir, watch = false } = options;

  const scheduledJobs = new Map<string, ScheduledJob>();
  const runHistory = new Map<string, JobRunLog[]>();
  let mainTimer: ReturnType<typeof setTimeout> | undefined;
  let safetyTimer: ReturnType<typeof setInterval> | undefined;
  let stopWatcher: (() => void) | undefined;
  let shuttingDown = false;

  function createContext(): JobContext {
    return { db, logger };
  }

  function appendRunLog(name: string, entry: JobRunLog): void {
    const history = runHistory.get(name) ?? [];
    history.push(entry);

    if (history.length > MAX_RUN_HISTORY) {
      history.splice(0, history.length - MAX_RUN_HISTORY);
    }

    runHistory.set(name, history);
  }

  function emitLifecycle(
    type: "job.started" | "job.completed" | "job.failed",
    job: RegisteredJob,
    runId: string,
    extra: Record<string, unknown> = {},
  ): void {
    eventBus.emit(type, {
      source: "jobs",
      payload: {
        name: job.name,
        filePath: job.filePath,
        schedule: job.schedule,
        runId,
        ...extra,
      },
    });
  }

  async function runWithRetries(job: RegisteredJob, runId: string): Promise<void> {
    const startedAt = new Date();

    emitLifecycle("job.started", job, runId);

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const result = job.handler(createContext());

        if (isPromise(result)) {
          await result;
        }

        const endedAt = new Date();
        const durationMs = endedAt.getTime() - startedAt.getTime();

        appendRunLog(job.name, {
          runId,
          startedAt: startedAt.toISOString(),
          endedAt: endedAt.toISOString(),
          status: "completed",
          attempt,
        });

        emitLifecycle("job.completed", job, runId, { durationMs, attempt });
        return;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);

        if (attempt < MAX_ATTEMPTS) {
          logger.error(
            `Job failed (${job.filePath}), retrying (${attempt}/${MAX_ATTEMPTS}): ${message}`,
          );
          await sleep(RETRY_DELAY_MS);
          continue;
        }

        const endedAt = new Date();
        const durationMs = endedAt.getTime() - startedAt.getTime();

        logger.error(`Job failed (${job.filePath}): ${message}`);

        appendRunLog(job.name, {
          runId,
          startedAt: startedAt.toISOString(),
          endedAt: endedAt.toISOString(),
          status: "failed",
          error: message,
          attempt,
        });

        emitLifecycle("job.failed", job, runId, { error: message, durationMs, attempt });
      }
    }
  }

  async function executeDueJob(scheduled: ScheduledJob): Promise<void> {
    if (scheduled.running || shuttingDown) {
      return;
    }

    scheduled.running = true;

    const runId = crypto.randomUUID();

    try {
      await runWithRetries(scheduled.job, runId);
    } finally {
      scheduled.running = false;
      scheduled.nextRun = getNextRun(scheduled.job.schedule, new Date());
      scheduleMainTimer();
    }
  }

  function processDueJobs(): void {
    if (shuttingDown) {
      return;
    }

    const now = new Date();

    for (const scheduled of scheduledJobs.values()) {
      if (scheduled.running) {
        continue;
      }

      if (scheduled.nextRun.getTime() <= now.getTime()) {
        const result = executeDueJob(scheduled);
        if (isPromise(result)) {
          result.catch((error: unknown) => {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`Job execution error (${scheduled.job.filePath}): ${message}`);
          });
        }
      }
    }
  }

  function clearTimers(): void {
    if (mainTimer) {
      clearTimeout(mainTimer);
      mainTimer = undefined;
    }

    if (safetyTimer) {
      clearInterval(safetyTimer);
      safetyTimer = undefined;
    }
  }

  function scheduleMainTimer(): void {
    if (shuttingDown) {
      return;
    }

    if (mainTimer) {
      clearTimeout(mainTimer);
      mainTimer = undefined;
    }

    if (scheduledJobs.size === 0) {
      return;
    }

    const now = Date.now();
    let earliest = Number.POSITIVE_INFINITY;

    for (const scheduled of scheduledJobs.values()) {
      earliest = Math.min(earliest, scheduled.nextRun.getTime());
    }

    const delay = Math.max(0, earliest - now);

    mainTimer = setTimeout(() => {
      processDueJobs();
      scheduleMainTimer();
    }, delay);
  }

  function startSafetyTick(): void {
    if (safetyTimer) {
      clearInterval(safetyTimer);
    }

    safetyTimer = setInterval(() => {
      processDueJobs();
    }, SAFETY_TICK_MS);
  }

  async function loadJobs(): Promise<void> {
    const reloadToken = `${Date.now()}_${crypto.randomUUID()}`;
    const discovered = await discoverJobs(jobsDir, reloadToken);
    const now = new Date();

    scheduledJobs.clear();

    for (const job of discovered) {
      scheduledJobs.set(job.name, {
        job,
        nextRun: getNextRun(job.schedule, now),
        running: false,
      });

      if (!runHistory.has(job.name)) {
        runHistory.set(job.name, []);
      }
    }

    scheduleMainTimer();

    if (discovered.length > 0) {
      logger.info(`Jobs: ${discovered.length} job(s) loaded from ${jobsDir}`);
    } else {
      logger.debug(`No jobs found in ${jobsDir}`);
    }
  }

  const engine: JobsEngine = {
    async load() {
      shuttingDown = false;
      await loadJobs();
      startSafetyTick();
    },

    async reload() {
      logger.debug(`Reloading jobs from ${jobsDir}`);
      await loadJobs();
    },

    list() {
      return [...scheduledJobs.values()].map((scheduled) => scheduled.job);
    },

    getRuns(name: string) {
      return [...(runHistory.get(name) ?? [])];
    },

    shutdown() {
      shuttingDown = true;
      stopWatcher?.();
      stopWatcher = undefined;
      clearTimers();
      scheduledJobs.clear();
    },
  };

  if (watch) {
    stopWatcher = createJobsWatcher(jobsDir, engine, logger);
  }

  return engine;
}
