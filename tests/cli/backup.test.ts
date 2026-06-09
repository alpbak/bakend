import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { backupCreate, backupRestore } from "../../src/cli/backup.ts";
import { initProject } from "../../src/cli/init.ts";
import { openProject } from "../../src/cli/project-context.ts";

describe("backup", () => {
  let tempDir = "";

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  test("create and restore backup archive", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-backup-"));
    const projectDir = initProject({ cwd: tempDir });
    const configPath = join(projectDir, "bakend.json");

    const context = await openProject({
      configPath,
      loadFunctions: false,
      loadJobs: false,
    });

    try {
      context.collections.create({
        name: "posts",
        fields: [{ name: "title", type: "string", required: true }],
      });
    } finally {
      context.close();
    }

    const archivePath = await backupCreate(configPath);
    expect(existsSync(archivePath)).toBe(true);

    rmSync(join(projectDir, "bakend.db"), { force: true });

    await backupRestore(configPath, archivePath, true);

    const restored = await openProject({
      configPath,
      loadFunctions: false,
      loadJobs: false,
    });

    try {
      expect(restored.collections.exists("posts")).toBe(true);
    } finally {
      restored.close();
    }
  });
});
