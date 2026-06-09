import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeDatabase, getSchemaVersion, initDatabase } from "../../../src/core/database/init.ts";
import { DEFAULT_CONFIG } from "../../../src/core/config/defaults.ts";
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
        ...DEFAULT_CONFIG,
        database: ":memory:",
      },
      logger,
    );

    expect(getSchemaVersion(db)).toBe("2");

    const collectionsTable = db
      .query<{ name: string }, []>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = '_collections'",
      )
      .get();
    expect(collectionsTable?.name).toBe("_collections");

    closeDatabase(db);
  });

  test("creates database file on disk", () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-db-"));
    const databasePath = join(tempDir, "nested", "bakend.db");
    const logger = createLogger("ERROR");

    const db = initDatabase(
      {
        ...DEFAULT_CONFIG,
        database: databasePath,
        storage: join(tempDir, "storage"),
      },
      logger,
    );

    expect(getSchemaVersion(db)).toBe("2");
    closeDatabase(db);
  });
});
