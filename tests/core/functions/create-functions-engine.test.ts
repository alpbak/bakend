import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initDatabase } from "../../../src/core/database/init.ts";
import { closeDatabase } from "../../../src/core/database/init.ts";
import { createEventBus } from "../../../src/core/events/create-event-bus.ts";
import type { BakendEvent } from "../../../src/core/events/types.ts";
import { createFunctionsEngine } from "../../../src/core/functions/create-functions-engine.ts";
import { createLogger } from "../../../src/core/logging/logger.ts";
import { DEFAULT_CONFIG } from "../../../src/core/config/defaults.ts";
import { createTestStorage } from "../../helpers/test-storage.ts";
import type { StorageEngine } from "../../../src/core/storage/types.ts";

describe.serial("createFunctionsEngine", () => {
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

  function createFixture(handlerBody: string, markerPath?: string): string {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-functions-engine-"));
    const functionsDir = join(tempDir, "functions");
    const postsDir = join(functionsDir, "posts");
    const marker = markerPath ?? join(tempDir, "marker.txt");
    mkdirSync(postsDir, { recursive: true });

    writeFileSync(
      join(postsDir, "handler.ts"),
      `import { onCreate } from "bakend/functions";

const markerPath = ${JSON.stringify(marker)};

onCreate("posts", async ({ record }) => {
  ${handlerBody}
});
`,
    );

    return functionsDir;
  }

  function setupDb(logger: ReturnType<typeof createLogger>, eventBus: ReturnType<typeof createEventBus>): StorageEngine {
    db = initDatabase({ ...DEFAULT_CONFIG, database: join(tempDir, "bakend.db") }, logger);
    return createTestStorage(db, logger, eventBus, join(tempDir, "storage")).storage;
  }

  test("executes handler when matching event is emitted", async () => {
    const functionsDir = createFixture(`await Bun.write(markerPath, record.title as string);`);
    const markerPath = join(tempDir, "marker.txt");

    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    const storage = setupDb(logger, eventBus);

    const engine = createFunctionsEngine({
      eventBus,
      db: db!,
      logger,
      functionsDir,
      storage,
    });

    await engine.load();

    eventBus.emit("posts.created", {
      source: "collections",
      payload: { id: "rec_1", title: "Hello" },
    });

    await eventBus.flush();

    const marker = await Bun.file(markerPath).text();
    expect(marker).toBe("Hello");

    engine.shutdown();
  });

  test("emits function lifecycle events", async () => {
    const functionsDir = createFixture("");

    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    const storage = setupDb(logger, eventBus);

    const lifecycle: string[] = [];
    eventBus.on("function.started", () => {
      lifecycle.push("started");
    });
    eventBus.on("function.completed", () => {
      lifecycle.push("completed");
    });
    eventBus.on("function.failed", () => {
      lifecycle.push("failed");
    });

    const engine = createFunctionsEngine({
      eventBus,
      db: db!,
      logger,
      functionsDir,
      storage,
    });

    await engine.load();

    eventBus.emit("posts.created", {
      source: "collections",
      payload: { id: "rec_1", title: "Hello" },
    });

    await eventBus.flush();

    expect(lifecycle).toEqual(["started", "completed"]);

    engine.shutdown();
  });

  test("handler errors are isolated and emit function.failed", async () => {
    const functionsDir = createFixture('throw new Error("boom");');

    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    const storage = setupDb(logger, eventBus);

    let failedEvent: BakendEvent | undefined;
    let completed = false;

    eventBus.on("function.failed", (event) => {
      failedEvent = event;
    });
    eventBus.on("function.completed", () => {
      completed = true;
    });

    const engine = createFunctionsEngine({
      eventBus,
      db: db!,
      logger,
      functionsDir,
      storage,
    });

    await engine.load();

    expect(() =>
      eventBus.emit("posts.created", {
        source: "collections",
        payload: { id: "rec_1" },
      }),
    ).not.toThrow();

    await eventBus.flush();

    expect(failedEvent).toBeDefined();
    expect((failedEvent!.payload as { error?: string }).error).toBe("boom");
    expect(completed).toBe(false);

    engine.shutdown();
  });

  test("reload replaces handlers", async () => {
    const functionsDir = createFixture(`await Bun.write(markerPath, "first");`);
    const markerPath = join(tempDir, "marker.txt");

    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    const storage = setupDb(logger, eventBus);

    const engine = createFunctionsEngine({
      eventBus,
      db: db!,
      logger,
      functionsDir,
      storage,
    });

    await engine.load();

    writeFileSync(
      join(functionsDir, "posts", "handler.ts"),
      `import { onCreate } from "bakend/functions";

const markerPath = ${JSON.stringify(markerPath)};

onCreate("posts", async () => {
  await Bun.write(markerPath, "second");
});
`,
    );

    await engine.reload();

    eventBus.emit("posts.created", {
      source: "collections",
      payload: { id: "rec_1" },
    });

    await eventBus.flush();

    const marker = await Bun.file(markerPath).text();
    expect(marker).toBe("second");

    engine.shutdown();
  });
});
