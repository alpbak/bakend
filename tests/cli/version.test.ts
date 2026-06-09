import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { VERSION } from "../../src/version.ts";

describe("bak version", () => {
  test("prints version from src/index.ts", async () => {
    const proc = Bun.spawn(["bun", "run", "src/index.ts", "version"], {
      cwd: join(import.meta.dir, "../.."),
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    const output = await new Response(proc.stdout).text();

    expect(exitCode).toBe(0);
    expect(output.trim()).toBe(VERSION);
  });
});
