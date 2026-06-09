import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createCollectionsEngine } from "../../../src/core/collections/create-collections-engine.ts";
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

function createTestEngine() {
  const db = new Database(":memory:");
  db.run(BOOTSTRAP_SQL);
  const logger = createLogger("ERROR");
  const eventBus = createEventBus(logger);
  const engine = createCollectionsEngine({ db, logger, eventBus });
  return { db, engine, eventBus };
}

describe("schema migration", () => {
  let db: Database | undefined;

  afterEach(() => {
    db?.close();
    db = undefined;
  });

  test("adds a new field", () => {
    const context = createTestEngine();
    db = context.db;

    context.engine.create({
      name: "posts",
      fields: [{ name: "title", type: "string" }],
    });

    context.engine.update("posts", {
      name: "posts",
      fields: [
        { name: "title", type: "string" },
        { name: "content", type: "text" },
      ],
    });

    const columns = db
      .query<{ name: string }, []>("PRAGMA table_info(posts)")
      .all()
      .map((row) => row.name);

    expect(columns).toContain("content");
  });

  test("removes a field", () => {
    const context = createTestEngine();
    db = context.db;

    context.engine.create({
      name: "posts",
      fields: [
        { name: "title", type: "string" },
        { name: "content", type: "text" },
      ],
    });

    context.engine.update("posts", {
      name: "posts",
      fields: [{ name: "title", type: "string" }],
    });

    const columns = db
      .query<{ name: string }, []>("PRAGMA table_info(posts)")
      .all()
      .map((row) => row.name);

    expect(columns).not.toContain("content");
  });

  test("renames a field when one remove and one add share type", () => {
    const context = createTestEngine();
    db = context.db;

    context.engine.create({
      name: "posts",
      fields: [{ name: "title", type: "string" }],
    });

    context.engine.update("posts", {
      name: "posts",
      fields: [{ name: "headline", type: "string" }],
    });

    const columns = db
      .query<{ name: string }, []>("PRAGMA table_info(posts)")
      .all()
      .map((row) => row.name);

    expect(columns).toContain("headline");
    expect(columns).not.toContain("title");
  });

  test("rejects type changes on existing fields", () => {
    const context = createTestEngine();
    db = context.db;

    context.engine.create({
      name: "posts",
      fields: [{ name: "count", type: "integer" }],
    });

    expect(() =>
      context.engine.update("posts", {
        name: "posts",
        fields: [{ name: "count", type: "string" }],
      }),
    ).toThrow(CollectionError);
  });

  test("updates permissions without DDL", () => {
    const context = createTestEngine();
    db = context.db;

    context.engine.create({
      name: "posts",
      fields: [{ name: "title", type: "string" }],
    });

    const updated = context.engine.update("posts", {
      name: "posts",
      fields: [{ name: "title", type: "string" }],
      permissions: { read: "authenticated" },
    });

    expect(updated.definition.permissions?.read).toBe("authenticated");
  });

  test("deletes a collection", () => {
    const context = createTestEngine();
    db = context.db;

    context.engine.create({
      name: "posts",
      fields: [{ name: "title", type: "string" }],
    });

    context.engine.delete("posts");

    expect(context.engine.exists("posts")).toBe(false);
    const table = db
      .query<{ name: string }, []>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'posts'",
      )
      .get();
    expect(table).toBeNull();
  });

  test("rejects delete when referenced by relation", () => {
    const context = createTestEngine();
    db = context.db;

    context.engine.create({
      name: "authors",
      fields: [{ name: "name", type: "string" }],
    });

    context.engine.create({
      name: "posts",
      fields: [{ name: "author_id", type: "relation", collection: "authors" }],
    });

    expect(() => context.engine.delete("authors")).toThrow(CollectionError);
  });

  test("emits system.collection.updated and deleted", () => {
    const context = createTestEngine();
    db = context.db;
    const events: string[] = [];

    context.eventBus.on("system.collection.updated", () => {
      events.push("updated");
    });
    context.eventBus.on("system.collection.deleted", () => {
      events.push("deleted");
    });

    context.engine.create({ name: "posts", fields: [] });
    context.engine.update("posts", { name: "posts", fields: [{ name: "title", type: "string" }] });
    context.engine.delete("posts");

    expect(events).toEqual(["updated", "deleted"]);
  });
});
