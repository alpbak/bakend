import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "../../../src/core/config/load.ts";
import { DEFAULT_CONFIG } from "../../../src/core/config/defaults.ts";

describe("loadConfig", () => {
  let tempDir = "";

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-config-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    delete process.env.BAKEND_PORT;
    delete process.env.BAKEND_DATABASE;
    delete process.env.BAKEND_STORAGE;
    delete process.env.BAKEND_LOG_LEVEL;
  });

  test("returns defaults when config file is missing", () => {
    const config = loadConfig({ configPath: join(tempDir, "missing.json") });
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  test("loads values from config file", () => {
    const configPath = join(tempDir, "bakend.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        port: 9000,
        database: "./data/app.db",
        storage: "./data/storage",
        logLevel: "DEBUG",
      }),
    );

    const config = loadConfig({ configPath });
    expect(config.port).toBe(9000);
    expect(config.database).toBe("./data/app.db");
    expect(config.storage).toBe("./data/storage");
    expect(config.logLevel).toBe("DEBUG");
  });

  test("applies environment overrides", () => {
    process.env.BAKEND_PORT = "9090";
    process.env.BAKEND_DATABASE = "./env.db";
    process.env.BAKEND_STORAGE = "./env-storage";
    process.env.BAKEND_LOG_LEVEL = "WARN";

    const config = loadConfig({ configPath: join(tempDir, "missing.json") });
    expect(config.port).toBe(9090);
    expect(config.database).toBe("./env.db");
    expect(config.storage).toBe("./env-storage");
    expect(config.logLevel).toBe("WARN");
  });

  test("throws on invalid port", () => {
    const configPath = join(tempDir, "bakend.json");
    writeFileSync(configPath, JSON.stringify({ port: 70000 }));

    expect(() => loadConfig({ configPath })).toThrow(/port must be an integer/);
  });

  test("throws on invalid JSON", () => {
    const configPath = join(tempDir, "bakend.json");
    writeFileSync(configPath, "{ invalid json");

    expect(() => loadConfig({ configPath })).toThrow(/Invalid JSON/);
  });

  test("throws on invalid log level", () => {
    process.env.BAKEND_LOG_LEVEL = "VERBOSE";
    expect(() => loadConfig({ configPath: join(tempDir, "missing.json") })).toThrow(
      /Invalid BAKEND_LOG_LEVEL/,
    );
  });
});
