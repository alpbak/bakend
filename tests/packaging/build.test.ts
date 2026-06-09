import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "../..");
const BINARY = join(ROOT, "dist/bak");
const RUN_PACKAGING_BUILD = process.env.BAKEND_RUN_PACKAGING_BUILD === "1";

describe("packaging build", () => {
  test.skipIf(!RUN_PACKAGING_BUILD)("produces dist/bak executable", async () => {
    const proc = Bun.spawn(["bun", "run", "build"], {
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    const stderr = await new Response(proc.stderr).text();

    expect(exitCode).toBe(0);
    expect(existsSync(BINARY)).toBe(true);
    expect(stderr).not.toContain("compilation failed");
  });
});
