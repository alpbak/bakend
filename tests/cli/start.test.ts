import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { printStartupBanner, start } from "../../src/cli/start.ts";

describe("start", () => {
  let tempDir = "";
  let result: Awaited<ReturnType<typeof start>> | undefined;

  afterEach(() => {
    result?.shutdown();
    result = undefined;

    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  test("prints startup banner", () => {
    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };

    try {
      printStartupBanner(8080);
    } finally {
      console.log = originalLog;
    }

    expect(lines).toEqual([
      "Bakend v0.1",
      "",
      "Database: ready",
      "API: ready",
      "",
      "Listening on :8080",
    ]);
  });

  test("starts server and responds to health checks", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-start-"));
    const configPath = join(tempDir, "bakend.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        port: 19080,
        database: join(tempDir, "bakend.db"),
        storage: join(tempDir, "storage"),
        logLevel: "ERROR",
      }),
    );

    result = await start({ configPath });

    const response = await fetch(`http://127.0.0.1:${result.server.port}/health`);
    expect(response.status).toBe(200);

    const body = (await response.json()) as { status: string; version: string };
    expect(body.status).toBe("ok");
    expect(body.version).toBe("0.1.0");
  });
});
