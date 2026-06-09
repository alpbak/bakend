import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initDatabase, closeDatabase } from "../../../src/core/database/init.ts";
import { createEventBus } from "../../../src/core/events/create-event-bus.ts";
import type { BakendEvent } from "../../../src/core/events/types.ts";
import { createJobsEngine } from "../../../src/core/jobs/create-jobs-engine.ts";
import { createLogger } from "../../../src/core/logging/logger.ts";
import { DEFAULT_CONFIG } from "../../../src/core/config/defaults.ts";
import { createTestStorage } from "../../helpers/test-storage.ts";
import type { StorageEngine } from "../../../src/core/storage/types.ts";

describe.serial("createJobsEngine", () => {
  let tempDir = "";
  let db: ReturnType<typeof initDatabase> | undefined;

  afterEach(() => {
    if (db) {
      closeDatabase(db);
      db = undefined;
    }

    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  function createJobsDir(handlerBody: string, schedule = "* * * * *"): string {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-jobs-engine-"));
    const jobsDir = join(tempDir, "jobs");
    mkdirSync(jobsDir, { recursive: true });

    writeFileSync(
      join(jobsDir, "heartbeat.ts"),
      `export const schedule = ${JSON.stringify(schedule)};

export default async ({ logger }) => {
  ${handlerBody}
};
`,
    );

    return jobsDir;
  }

  function setupDb(logger: ReturnType<typeof createLogger>, eventBus: ReturnType<typeof createEventBus>): StorageEngine {
    db = initDatabase({ ...DEFAULT_CONFIG, database: join(tempDir, "bakend.db") }, logger);
    return createTestStorage(db, logger, eventBus, join(tempDir, "storage")).storage;
  }

  test("loads jobs and lists them", async () => {
    const jobsDir = createJobsDir("logger.info('tick');");

    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    const storage = setupDb(logger, eventBus);

    const engine = createJobsEngine({
      eventBus,
      db: db!,
      logger,
      jobsDir,
      storage,
    });

    await engine.load();

    const jobs = engine.list();
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.name).toBe("heartbeat");
    expect(jobs[0]?.schedule).toBe("* * * * *");

    engine.shutdown();
  });

  test("executes due jobs and emits lifecycle events", async () => {
    const markerPath = join(tempDir, "marker.txt");
    const jobsDir = createJobsDir(
      `await Bun.write(${JSON.stringify(markerPath)}, "ran");`,
      "* * * * *",
    );

    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    const storage = setupDb(logger, eventBus);

    const lifecycle: string[] = [];
    eventBus.on("job.started", () => {
      lifecycle.push("started");
    });
    eventBus.on("job.completed", () => {
      lifecycle.push("completed");
    });
    eventBus.on("job.failed", () => {
      lifecycle.push("failed");
    });

    const engine = createJobsEngine({
      eventBus,
      db: db!,
      logger,
      jobsDir,
      storage,
      dueImmediately: true,
    });

    await engine.load();
    await engine.runDueJobs();
    await eventBus.flush();

    const marker = await Bun.file(markerPath).text();
    expect(marker).toBe("ran");
    expect(lifecycle).toContain("started");
    expect(lifecycle).toContain("completed");

    const runs = engine.getRuns("heartbeat");
    expect(runs.length).toBeGreaterThan(0);
    expect(runs[0]?.status).toBe("completed");

    engine.shutdown();
  });

  test("handler errors are isolated, retried, and emit job.failed", async () => {
    const jobsDir = createJobsDir('throw new Error("boom");', "* * * * *");

    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    const storage = setupDb(logger, eventBus);

    let failedEvent: BakendEvent | undefined;
    let completed = false;

    eventBus.on("job.failed", (event) => {
      failedEvent = event;
    });
    eventBus.on("job.completed", () => {
      completed = true;
    });

    const engine = createJobsEngine({
      eventBus,
      db: db!,
      logger,
      jobsDir,
      storage,
      dueImmediately: true,
      retryDelayMs: 1,
    });

    await engine.load();
    await engine.runDueJobs();
    await eventBus.flush();

    expect(failedEvent).toBeDefined();
    expect((failedEvent!.payload as { error?: string }).error).toBe("boom");
    expect((failedEvent!.payload as { attempt?: number }).attempt).toBe(3);
    expect(completed).toBe(false);

    const runs = engine.getRuns("heartbeat");
    expect(runs.length).toBeGreaterThan(0);
    expect(runs[runs.length - 1]?.status).toBe("failed");
    expect(runs[runs.length - 1]?.attempt).toBe(3);

    engine.shutdown();
  });

  test("reload replaces jobs", async () => {
    const markerPath = join(tempDir, "marker.txt");
    const jobsDir = createJobsDir(
      `await Bun.write(${JSON.stringify(markerPath)}, "first");`,
      "* * * * *",
    );

    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    const storage = setupDb(logger, eventBus);

    const engine = createJobsEngine({
      eventBus,
      db: db!,
      logger,
      jobsDir,
      storage,
      dueImmediately: true,
    });

    await engine.load();

    writeFileSync(
      join(jobsDir, "heartbeat.ts"),
      `export const schedule = "* * * * *";

export default async () => {
  await Bun.write(${JSON.stringify(markerPath)}, "second");
};
`,
    );

    await engine.reload();
    await engine.runDueJobs();

    const marker = await Bun.file(markerPath).text();
    expect(marker).toBe("second");

    engine.shutdown();
  });
});
