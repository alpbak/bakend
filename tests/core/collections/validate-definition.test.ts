import { describe, expect, test } from "bun:test";
import { validateDefinition } from "../../../src/core/collections/validate-definition.ts";
import type { CollectionDefinition } from "../../../src/core/collections/types.ts";

describe("validateDefinition", () => {
  test("accepts a valid collection definition", () => {
    const definition: CollectionDefinition = {
      name: "posts",
      fields: [
        { name: "title", type: "string", required: true, min: 1, max: 200 },
        { name: "content", type: "text" },
      ],
    };

    const result = validateDefinition(definition, { existingCollections: [] });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("rejects invalid collection names", () => {
    const result = validateDefinition(
      { name: "Posts", fields: [] },
      { existingCollections: [] },
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0]?.rule).toBe("name");
  });

  test("rejects reserved collection names", () => {
    const result = validateDefinition(
      { name: "_collections", fields: [] },
      { existingCollections: [] },
    );

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.rule === "reserved")).toBe(true);
  });

  test("rejects duplicate collection names", () => {
    const result = validateDefinition(
      { name: "posts", fields: [] },
      { existingCollections: ["posts"] },
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0]?.rule).toBe("exists");
  });

  test("rejects reserved and duplicate field names", () => {
    const result = validateDefinition(
      {
        name: "posts",
        fields: [
          { name: "id", type: "string" },
          { name: "title", type: "string" },
          { name: "title", type: "text" },
        ],
      },
      { existingCollections: [] },
    );

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.rule === "reserved")).toBe(true);
    expect(result.errors.some((error) => error.rule === "duplicate")).toBe(true);
  });

  test("requires relation fields to reference existing collections", () => {
    const result = validateDefinition(
      {
        name: "posts",
        fields: [{ name: "author_id", type: "relation", collection: "authors" }],
      },
      { existingCollections: [] },
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0]?.rule).toBe("relation");
  });

  test("allows relation fields to reference system users collection", () => {
    const result = validateDefinition(
      {
        name: "posts",
        fields: [{ name: "author_id", type: "relation", collection: "users" }],
      },
      { existingCollections: [] },
    );

    expect(result.valid).toBe(true);
  });

  test("accepts relation fields when target collection exists", () => {
    const result = validateDefinition(
      {
        name: "posts",
        fields: [{ name: "author_id", type: "relation", collection: "users" }],
      },
      { existingCollections: ["users"] },
    );

    expect(result.valid).toBe(true);
  });

  test("rejects incompatible validation rules", () => {
    const result = validateDefinition(
      {
        name: "posts",
        fields: [{ name: "active", type: "boolean", regex: "^true$" }],
      },
      { existingCollections: [] },
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0]?.rule).toBe("regex");
  });
});
