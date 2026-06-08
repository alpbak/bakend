import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createCollectionsEngine } from "../../../src/core/collections/create-collections-engine.ts";
import { CollectionError } from "../../../src/core/collections/types.ts";
import { createEventBus } from "../../../src/core/events/create-event-bus.ts";
import { createLogger } from "../../../src/core/logging/logger.ts";

const BOOTSTRAP_SQL = `
  CREATE TABLE IF NOT EXISTS _bakend_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS _collections (
    name TEXT PRIMARY KEY,
    definition TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

function createTestEngine() {
  const db = new Database(":memory:");
  db.run(BOOTSTRAP_SQL);
  const logger = createLogger("ERROR");
  const eventBus = createEventBus(logger);
  const engine = createCollectionsEngine({ db, logger, eventBus });
  return { db, engine, eventBus };
}

describe("createCollectionsEngine", () => {
  let db: Database | undefined;

  afterEach(() => {
    db?.close();
    db = undefined;
  });

  test("creates a collection and persists metadata", () => {
    const context = createTestEngine();
    db = context.db;

    const meta = context.engine.create({
      name: "posts",
      fields: [{ name: "title", type: "string", required: true }],
    });

    expect(meta.name).toBe("posts");
    expect(context.engine.exists("posts")).toBe(true);
    expect(context.engine.get("posts")?.definition.name).toBe("posts");
    expect(context.engine.list().map((item) => item.name)).toEqual(["posts"]);

    const table = db
      .query<{ name: string }, []>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'posts'",
      )
      .get();
    expect(table?.name).toBe("posts");
  });

  test("emits system.collection.created", () => {
    const context = createTestEngine();
    db = context.db;
    let receivedType = "";

    context.eventBus.on("system.collection.created", (event) => {
      receivedType = event.type;
    });

    context.engine.create({
      name: "posts",
      fields: [],
    });

    expect(receivedType).toBe("system.collection.created");
  });

  test("rejects invalid definitions", () => {
    const context = createTestEngine();
    db = context.db;

    expect(() =>
      context.engine.create({
        name: "Posts",
        fields: [],
      }),
    ).toThrow(CollectionError);
  });

  test("reloads existing collections and recreates missing tables", () => {
    const sharedDb = new Database(":memory:");
    sharedDb.run(BOOTSTRAP_SQL);

    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);

    const first = createCollectionsEngine({ db: sharedDb, logger, eventBus });
    first.create({
      name: "posts",
      fields: [{ name: "title", type: "string" }],
    });

    sharedDb.run('DROP TABLE "posts"');

    const second = createCollectionsEngine({ db: sharedDb, logger, eventBus });
    expect(second.exists("posts")).toBe(true);

    const table = sharedDb
      .query<{ name: string }, []>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'posts'",
      )
      .get();
    expect(table?.name).toBe("posts");

    sharedDb.close();
  });
});
