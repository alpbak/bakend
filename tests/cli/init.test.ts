import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initProject } from "../../src/cli/init.ts";

describe("init", () => {
  let tempDir = "";

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  test("creates project scaffold in a new directory", () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-init-"));
    const projectDir = initProject({ name: "myapp", cwd: tempDir });

    expect(projectDir).toBe(join(tempDir, "myapp"));
    expect(existsSync(join(projectDir, "bakend.json"))).toBe(true);
    expect(existsSync(join(projectDir, ".gitignore"))).toBe(true);
    expect(existsSync(join(projectDir, "README.md"))).toBe(true);
    expect(existsSync(join(projectDir, "collections"))).toBe(true);
    expect(existsSync(join(projectDir, "functions"))).toBe(true);
    expect(existsSync(join(projectDir, "jobs"))).toBe(true);

    const config = JSON.parse(readFileSync(join(projectDir, "bakend.json"), "utf8")) as {
      auth: { jwtSecret: string };
    };
    expect(config.auth.jwtSecret).toBeTruthy();
    expect(config.auth.jwtSecret).not.toBe("dev-only-change-me");
  });

  test("initializes current directory when empty and no name given", () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-init-"));
    const projectDir = initProject({ cwd: tempDir });

    expect(projectDir).toBe(tempDir);
    expect(existsSync(join(projectDir, "bakend.json"))).toBe(true);
  });

  test("refuses non-empty directory", () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-init-"));
    writeFileSync(join(tempDir, "existing.txt"), "data", "utf8");

    expect(() => initProject({ cwd: tempDir })).toThrow(/not empty/);
  });
});
