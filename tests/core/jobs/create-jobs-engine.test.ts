import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initDatabase, closeDatabase } from "../../../src/core/database/init.ts";
import { createEventBus } from "../../../src/core/events/create-event-bus.ts";
import type { BakendEvent } from "../../../src/core/events/types.ts";
import { createJobsEngine } from "../../../src/core/jobs/create-jobs-engine.ts";
import { createLogger } from "../../../src/core/logging/logger.ts";
import { DEFAULT_CONFIG } from "../../../src/core/config/defaults.ts";

describe.serial("createJobsEngine", () => {
  let tempDir = "";
  let db: ReturnType<typeof initDatabase> | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    tempDir = mkdtempSync(join(tmpdir(), "bakend-jobs-engine-"));
  });

  afterEach(() => {
    jest.useRealTimers();

    if (db) {
      closeDatabase(db);
      db = undefined;
    }

    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  async function advanceAndFlush(ms: number, eventBus: ReturnType<typeof createEventBus>): Promise<void> {
    jest.advanceTimersByTime(ms);

    for (let index = 0; index < 20; index += 1) {
      await Promise.resolve();
    }

    await eventBus.flush();
  }

  function createJobsDir(handlerBody: string, schedule = "* * * * *"): string {
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

  test("loads jobs and lists them", async () => {
    const jobsDir = createJobsDir("logger.info('tick');");

    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    db = initDatabase({ ...DEFAULT_CONFIG, database: join(tempDir, "bakend.db") }, logger);

    const engine = createJobsEngine({
      eventBus,
      db,
      logger,
      jobsDir,
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
    db = initDatabase({ ...DEFAULT_CONFIG, database: join(tempDir, "bakend.db") }, logger);

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
      db,
      logger,
      jobsDir,
    });

    await engine.load();
    await advanceAndFlush(65_000, eventBus);

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
    db = initDatabase({ ...DEFAULT_CONFIG, database: join(tempDir, "bakend.db") }, logger);

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
      db,
      logger,
      jobsDir,
    });

    await engine.load();
    await advanceAndFlush(65_000, eventBus);
    await advanceAndFlush(5_000, eventBus);
    await advanceAndFlush(5_000, eventBus);
    await advanceAndFlush(5_000, eventBus);

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
    db = initDatabase({ ...DEFAULT_CONFIG, database: join(tempDir, "bakend.db") }, logger);

    const engine = createJobsEngine({
      eventBus,
      db,
      logger,
      jobsDir,
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
    await advanceAndFlush(65_000, eventBus);

    const marker = await Bun.file(markerPath).text();
    expect(marker).toBe("second");

    engine.shutdown();
  });
});
