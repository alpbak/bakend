import { describe, expect, test } from "bun:test";
import {
  generateCreateTableSql,
  generateIndexSql,
  generateTableDDL,
} from "../../../src/core/collections/generate-schema.ts";

describe("generate-schema", () => {
  test("generates create table SQL with system columns", () => {
    const sql = generateCreateTableSql({
      name: "posts",
      fields: [{ name: "title", type: "string", required: true }],
    });

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "posts"');
    expect(sql).toContain('"id" TEXT PRIMARY KEY');
    expect(sql).toContain('"created_at" TEXT NOT NULL');
    expect(sql).toContain('"updated_at" TEXT NOT NULL');
    expect(sql).toContain('"title" TEXT NOT NULL');
  });

  test("maps field types to sqlite columns", () => {
    const sql = generateCreateTableSql({
      name: "metrics",
      fields: [
        { name: "count", type: "integer" },
        { name: "ratio", type: "float" },
        { name: "active", type: "boolean" },
        { name: "payload", type: "json" },
      ],
    });

    expect(sql).toContain('"count" INTEGER');
    expect(sql).toContain('"ratio" REAL');
    expect(sql).toContain('"active" INTEGER');
    expect(sql).toContain('"payload" TEXT');
  });

  test("converts camelCase field names to snake_case columns", () => {
    const sql = generateCreateTableSql({
      name: "posts",
      fields: [{ name: "authorId", type: "relation", collection: "users" }],
    });

    expect(sql).toContain('"author_id" TEXT');
  });

  test("adds unique constraints and relation indexes", () => {
    const ddl = generateTableDDL({
      name: "users",
      fields: [
        { name: "email", type: "string", unique: true },
        { name: "profileId", type: "relation", collection: "profiles" },
      ],
    });

    expect(ddl[0]).toContain('"email" TEXT UNIQUE');
    expect(generateIndexSql({
      name: "users",
      fields: [{ name: "profileId", type: "relation", collection: "profiles" }],
    })[0]).toContain('CREATE INDEX IF NOT EXISTS "idx_users_profileId"');
  });
});
