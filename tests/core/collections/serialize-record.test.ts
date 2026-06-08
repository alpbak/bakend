import { describe, expect, test } from "bun:test";
import { recordToColumns, rowToRecord } from "../../../src/core/collections/serialize-record.ts";
import type { CollectionDefinition } from "../../../src/core/collections/types.ts";

const definition: CollectionDefinition = {
  name: "posts",
  fields: [
    { name: "title", type: "string", required: true },
    { name: "published", type: "boolean" },
    { name: "views", type: "integer" },
    { name: "rating", type: "float" },
    { name: "metadata", type: "json" },
    { name: "authorId", type: "relation", collection: "users" },
  ],
};

describe("serialize-record", () => {
  test("rowToRecord converts snake_case columns and coerces types", () => {
    const record = rowToRecord(definition, {
      id: "rec_123",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
      title: "Hello",
      published: 1,
      views: 42,
      rating: 4.5,
      metadata: '{"tags":["a"]}',
      author_id: "rec_user",
    });

    expect(record).toEqual({
      id: "rec_123",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      title: "Hello",
      published: true,
      views: 42,
      rating: 4.5,
      metadata: { tags: ["a"] },
      authorId: "rec_user",
    });
  });

  test("recordToColumns converts camelCase fields for storage", () => {
    const columns = recordToColumns(definition, {
      title: "Hello",
      published: false,
      views: 10,
      rating: 3.2,
      metadata: { ok: true },
      authorId: "rec_user",
    });

    expect(columns).toEqual({
      title: "Hello",
      published: 0,
      views: 10,
      rating: 3.2,
      metadata: '{"ok":true}',
      author_id: "rec_user",
    });
  });

  test("recordToColumns only includes specified fields when provided", () => {
    const columns = recordToColumns(definition, { title: "Updated" }, ["title"]);

    expect(columns).toEqual({ title: "Updated" });
  });
});
