import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeDatabase, getSchemaVersion, initDatabase } from "../../../src/core/database/init.ts";
import { createLogger } from "../../../src/core/logging/logger.ts";

describe("initDatabase", () => {
  let tempDir = "";

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  test("creates in-memory database with meta table", () => {
    const logger = createLogger("ERROR");
    const db = initDatabase(
      {
        port: 8080,
        database: ":memory:",
        storage: "./storage",
        logLevel: "INFO",
      },
      logger,
    );

    expect(getSchemaVersion(db)).toBe("0");
    closeDatabase(db);
  });

  test("creates database file on disk", () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-db-"));
    const databasePath = join(tempDir, "nested", "bakend.db");
    const logger = createLogger("ERROR");

    const db = initDatabase(
      {
        port: 8080,
        database: databasePath,
        storage: join(tempDir, "storage"),
        logLevel: "INFO",
      },
      logger,
    );

    expect(getSchemaVersion(db)).toBe("0");
    closeDatabase(db);
  });
});
