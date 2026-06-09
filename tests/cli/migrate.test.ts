import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initProject } from "../../src/cli/init.ts";
import {
  migrateApply,
  migrateExport,
  migrateStatus,
  readCollectionFiles,
} from "../../src/cli/migrate.ts";
import { openProject } from "../../src/cli/project-context.ts";

describe("migrate", () => {
  let tempDir = "";

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  test("apply creates collection from JSON file", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-migrate-"));
    const projectDir = initProject({ cwd: tempDir });

    writeFileSync(
      join(projectDir, "collections", "posts.json"),
      JSON.stringify(
        {
          name: "posts",
          fields: [{ name: "title", type: "string", required: true }],
        },
        null,
        2,
      ),
      "utf8",
    );

    const context = await openProject({
      configPath: join(projectDir, "bakend.json"),
      loadFunctions: false,
      loadJobs: false,
    });

    try {
      const applied = migrateApply(context);
      expect(applied).toEqual(["created posts"]);
      expect(context.collections.exists("posts")).toBe(true);
    } finally {
      context.close();
    }
  });

  test("export writes database collections to JSON files", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-migrate-"));
    const projectDir = initProject({ cwd: tempDir });

    writeFileSync(
      join(projectDir, "collections", "posts.json"),
      JSON.stringify(
        {
          name: "posts",
          fields: [{ name: "title", type: "string", required: true }],
        },
        null,
        2,
      ),
      "utf8",
    );

    const context = await openProject({
      configPath: join(projectDir, "bakend.json"),
      loadFunctions: false,
      loadJobs: false,
    });

    try {
      migrateApply(context);
      rmSync(join(projectDir, "collections", "posts.json"));
      const exported = migrateExport(context);
      expect(exported).toEqual(["posts"]);
      expect(existsSync(join(projectDir, "collections", "posts.json"))).toBe(true);
      const files = readCollectionFiles(join(projectDir, "collections"));
      expect(files.get("posts")?.fields[0]?.name).toBe("title");
    } finally {
      context.close();
    }
  });

  test("status reports drift between files and database", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-migrate-"));
    const projectDir = initProject({ cwd: tempDir });

    writeFileSync(
      join(projectDir, "collections", "posts.json"),
      JSON.stringify(
        {
          name: "posts",
          fields: [{ name: "title", type: "string", required: true }],
        },
        null,
        2,
      ),
      "utf8",
    );

    const context = await openProject({
      configPath: join(projectDir, "bakend.json"),
      loadFunctions: false,
      loadJobs: false,
    });

    try {
      migrateApply(context);
      writeFileSync(
        join(projectDir, "collections", "posts.json"),
        JSON.stringify(
          {
            name: "posts",
            fields: [
              { name: "title", type: "string", required: true },
              { name: "body", type: "text" },
            ],
          },
          null,
          2,
        ),
        "utf8",
      );

      const status = migrateStatus(context);
      expect(status).toEqual([{ name: "posts", status: "drift" }]);
    } finally {
      context.close();
    }
  });
});
