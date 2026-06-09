import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "../..");
const BINARY = join(ROOT, "dist/bak");
const RUN_PACKAGING_BUILD = process.env.BAKEND_RUN_PACKAGING_BUILD === "1";

describe("embedded dashboard", () => {
  let tempDir = "";
  let proc: Bun.Subprocess<"pipe", "pipe", "pipe"> | undefined;

  afterEach(async () => {
    if (proc) {
      proc.kill("SIGTERM");
      await proc.exited.catch(() => undefined);
      proc = undefined;
    }

    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  test.skipIf(!RUN_PACKAGING_BUILD || !existsSync(BINARY))(
    "serves dashboard HTML at /_/",
    async () => {
      tempDir = mkdtempSync(join(tmpdir(), "bakend-dashboard-"));
      const configPath = join(tempDir, "bakend.json");
      writeFileSync(
        configPath,
        JSON.stringify({
          port: 19124,
          database: join(tempDir, "bakend.db"),
          storage: join(tempDir, "storage"),
          logLevel: "ERROR",
          dashboard: { enabled: true },
        }),
      );

      proc = Bun.spawn([BINARY, "start", "--config", configPath], {
        cwd: tempDir,
        stdout: "pipe",
        stderr: "pipe",
      });

      await Bun.sleep(2000);

      const response = await fetch("http://localhost:19124/_/");
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(html.toLowerCase()).toContain("<!doctype html");
    },
  );
});
