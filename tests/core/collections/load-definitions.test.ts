import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import { createCollectionsEngine } from "../../../src/core/collections/create-collections-engine.ts";
import { loadCollectionDefinitions } from "../../../src/core/collections/load-definitions.ts";
import { CollectionError } from "../../../src/core/collections/types.ts";
import { createEventBus } from "../../../src/core/events/create-event-bus.ts";
import { createLogger } from "../../../src/core/logging/logger.ts";

const BOOTSTRAP_SQL = `
  CREATE TABLE IF NOT EXISTS _collections (
    name TEXT PRIMARY KEY,
    definition TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

describe("loadCollectionDefinitions", () => {
  let tempDir = "";
  let db: Database | undefined;

  afterEach(() => {
    db?.close();
    db = undefined;

    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  function createEngine() {
    const database = new Database(":memory:");
    database.run(BOOTSTRAP_SQL);
    db = database;
    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    return createCollectionsEngine({ db: database, logger, eventBus });
  }

  test("loads collection definitions from json files", () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-collections-"));
    const collectionsDir = join(tempDir, "collections");
    mkdirSync(collectionsDir, { recursive: true });

    writeFileSync(
      join(collectionsDir, "posts.json"),
      JSON.stringify({
        name: "posts",
        fields: [{ name: "title", type: "string", required: true }],
      }),
    );

    const engine = createEngine();
    loadCollectionDefinitions(engine, collectionsDir, createLogger("ERROR"));

    expect(engine.exists("posts")).toBe(true);
  });

  test("skips existing collections with identical definitions", () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-collections-"));
    const collectionsDir = join(tempDir, "collections");
    mkdirSync(collectionsDir, { recursive: true });

    const definition = {
      name: "posts",
      fields: [{ name: "title", type: "string" as const }],
    };

    writeFileSync(join(collectionsDir, "posts.json"), JSON.stringify(definition));

    const engine = createEngine();
    engine.create(definition);

    expect(() => loadCollectionDefinitions(engine, collectionsDir, createLogger("ERROR"))).not.toThrow();
    expect(engine.list()).toHaveLength(1);
  });

  test("throws when existing collection definition conflicts", () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-collections-"));
    const collectionsDir = join(tempDir, "collections");
    mkdirSync(collectionsDir, { recursive: true });

    writeFileSync(
      join(collectionsDir, "posts.json"),
      JSON.stringify({
        name: "posts",
        fields: [{ name: "title", type: "text" }],
      }),
    );

    const engine = createEngine();
    engine.create({
      name: "posts",
      fields: [{ name: "title", type: "string" }],
    });

    expect(() => loadCollectionDefinitions(engine, collectionsDir, createLogger("ERROR"))).toThrow(
      CollectionError,
    );
  });

  test("throws on invalid json files", () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-collections-"));
    const collectionsDir = join(tempDir, "collections");
    mkdirSync(collectionsDir, { recursive: true });
    writeFileSync(join(collectionsDir, "broken.json"), "{ not-json");

    const engine = createEngine();

    expect(() => loadCollectionDefinitions(engine, collectionsDir, createLogger("ERROR"))).toThrow(
      CollectionError,
    );
  });
});
