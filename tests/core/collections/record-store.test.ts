import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createCollectionsEngine } from "../../../src/core/collections/create-collections-engine.ts";
import {
  CollectionNotFoundError,
  createRecordStore,
  RecordNotFoundError,
  RecordValidationError,
} from "../../../src/core/collections/record-store.ts";
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

function createTestContext() {
  const db = new Database(":memory:");
  db.run(BOOTSTRAP_SQL);
  const logger = createLogger("ERROR");
  const eventBus = createEventBus(logger);
  const collections = createCollectionsEngine({ db, logger, eventBus });
  const recordStore = createRecordStore({ db, collections, logger, eventBus });

  collections.create({
    name: "posts",
    fields: [
      { name: "title", type: "string", required: true },
      { name: "published", type: "boolean" },
      { name: "slug", type: "string", unique: true },
    ],
  });

  return { db, collections, recordStore, eventBus };
}

describe("createRecordStore", () => {
  let db: Database | undefined;

  afterEach(() => {
    db?.close();
    db = undefined;
  });

  test("creates and reads a record", () => {
    const context = createTestContext();
    db = context.db;

    const created = context.recordStore.create("posts", {
      title: "Hello",
      published: true,
      slug: "hello",
    });

    expect(created.id).toMatch(/^rec_/);
    expect(created.title).toBe("Hello");
    expect(created.published).toBe(true);
    expect(created.createdAt).toBeString();
    expect(created.updatedAt).toBeString();

    const fetched = context.recordStore.get("posts", created.id as string);
    expect(fetched).toEqual(created);
  });

  test("lists records newest first", async () => {
    const context = createTestContext();
    db = context.db;

    const first = context.recordStore.create("posts", { title: "First", slug: "first" });
    await Bun.sleep(2);
    const second = context.recordStore.create("posts", { title: "Second", slug: "second" });

    const items = context.recordStore.list("posts");
    expect(items.map((item) => item.id)).toEqual([second.id, first.id]);
  });

  test("updates a record partially", () => {
    const context = createTestContext();
    db = context.db;

    const created = context.recordStore.create("posts", {
      title: "Hello",
      published: false,
      slug: "hello",
    });

    const updated = context.recordStore.update("posts", created.id as string, {
      title: "Updated",
    });

    expect(updated.title).toBe("Updated");
    expect(updated.published).toBe(false);
    expect(updated.updatedAt).toBeString();
  });

  test("deletes a record", () => {
    const context = createTestContext();
    db = context.db;

    const created = context.recordStore.create("posts", { title: "Hello", slug: "hello" });
    expect(context.recordStore.delete("posts", created.id as string)).toBe(true);
    expect(context.recordStore.get("posts", created.id as string)).toBeNull();
    expect(context.recordStore.delete("posts", created.id as string)).toBe(false);
  });

  test("throws validation errors on create", () => {
    const context = createTestContext();
    db = context.db;

    expect(() => context.recordStore.create("posts", { slug: "missing-title" })).toThrow(
      RecordValidationError,
    );
  });

  test("throws when collection does not exist", () => {
    const context = createTestContext();
    db = context.db;

    expect(() => context.recordStore.create("missing", { title: "Hello" })).toThrow(
      CollectionNotFoundError,
    );
  });

  test("throws when updating missing record", () => {
    const context = createTestContext();
    db = context.db;

    expect(() =>
      context.recordStore.update("posts", "rec_missing", { title: "Updated" }),
    ).toThrow(RecordNotFoundError);
  });

  test("emits record lifecycle events", () => {
    const context = createTestContext();
    db = context.db;
    const events: string[] = [];

    context.eventBus.on("posts.created", () => {
      events.push("created");
    });
    context.eventBus.on("posts.updated", () => {
      events.push("updated");
    });
    context.eventBus.on("posts.deleted", () => {
      events.push("deleted");
    });

    const created = context.recordStore.create("posts", { title: "Hello", slug: "hello" });
    context.recordStore.update("posts", created.id as string, { title: "Updated" });
    context.recordStore.delete("posts", created.id as string);

    expect(events).toEqual(["created", "updated", "deleted"]);
  });
});
