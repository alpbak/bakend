import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initDatabase, closeDatabase } from "../../../src/core/database/init.ts";
import { createEventBus } from "../../../src/core/events/create-event-bus.ts";
import { createFunctionsEngine } from "../../../src/core/functions/create-functions-engine.ts";
import { createLogger } from "../../../src/core/logging/logger.ts";
import { DEFAULT_CONFIG } from "../../../src/core/config/defaults.ts";
import { createTestStorage } from "../../helpers/test-storage.ts";

describe("function hot reload", () => {
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

  test("watch mode starts and shuts down cleanly", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-functions-watch-"));
    const functionsDir = join(tempDir, "functions");
    const postsDir = join(functionsDir, "posts");

    mkdirSync(postsDir, { recursive: true });
    writeFileSync(
      join(postsDir, "handler.ts"),
      `import { onCreate } from "bakend/functions";

onCreate("posts", async () => {});
`,
    );

    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    db = initDatabase({ ...DEFAULT_CONFIG, database: join(tempDir, "bakend.db") }, logger);
    const { storage } = createTestStorage(db, logger, eventBus, join(tempDir, "storage"));

    const engine = createFunctionsEngine({
      eventBus,
      db,
      logger,
      functionsDir,
      storage,
      watch: true,
    });

    await engine.load();
    expect(engine.list()).toHaveLength(1);

    engine.shutdown();
  });
});
