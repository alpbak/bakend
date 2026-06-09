import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createCollectionsEngine } from "../../../src/core/collections/create-collections-engine.ts";
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

describe("validateRecord", () => {
  let db: Database | undefined;

  afterEach(() => {
    db?.close();
    db = undefined;
  });

  function createEngine() {
    const database = new Database(":memory:");
    database.run(BOOTSTRAP_SQL);
    db = database;
    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    return createCollectionsEngine({ db: database, logger, eventBus });
  }

  test("validates required, min, max, regex, and types on create", () => {
    const engine = createEngine();

    engine.create({
      name: "posts",
      fields: [
        { name: "title", type: "string", required: true, min: 3, max: 10, regex: "^[A-Z]" },
        { name: "views", type: "integer", min: 0, max: 100 },
        { name: "published", type: "boolean" },
      ],
    });

    const invalid = engine.validateRecord(
      "posts",
      { title: "ab", views: 200, published: "yes" },
      "create",
    );

    expect(invalid.valid).toBe(false);
    expect(invalid.errors.map((error) => error.rule).sort()).toEqual(
      ["max", "min", "regex", "type"].sort(),
    );

    const valid = engine.validateRecord(
      "posts",
      { title: "Hello", views: 10, published: true },
      "create",
    );

    expect(valid.valid).toBe(true);
  });

  test("validates only provided fields on update", () => {
    const engine = createEngine();

    engine.create({
      name: "posts",
      fields: [{ name: "title", type: "string", required: true }],
    });

    const result = engine.validateRecord("posts", { title: "" }, "update");
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.rule).toBe("required");

    const skipped = engine.validateRecord("posts", {}, "update");
    expect(skipped.valid).toBe(true);
  });

  test("enforces unique constraints against existing records", () => {
    const engine = createEngine();
    const database = db!;

    engine.create({
      name: "accounts",
      fields: [{ name: "email", type: "string", unique: true }],
    });

    database.run(
      'INSERT INTO "accounts" ("id", "created_at", "updated_at", "email") VALUES (?, ?, ?, ?)',
      ["rec_1", "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z", "a@example.com"],
    );

    const duplicate = engine.validateRecord(
      "accounts",
      { email: "a@example.com" },
      "create",
    );
    expect(duplicate.valid).toBe(false);
    expect(duplicate.errors[0]?.rule).toBe("unique");

    const update = engine.validateRecord(
      "accounts",
      { id: "rec_1", email: "a@example.com" },
      "update",
    );
    expect(update.valid).toBe(true);
  });

  test("returns error when collection does not exist", () => {
    const engine = createEngine();
    const result = engine.validateRecord("missing", { title: "Hello" }, "create");

    expect(result.valid).toBe(false);
    expect(result.errors[0]?.rule).toBe("exists");
  });
});
