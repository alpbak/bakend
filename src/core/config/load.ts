import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { LOG_LEVELS } from "../logging/types.ts";
import type { LogLevel } from "../logging/types.ts";
import { DEFAULT_CONFIG, DEFAULT_CONFIG_PATH } from "./defaults.ts";
import type { BakendConfig, LoadConfigOptions } from "./types.ts";

function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === "string" && LOG_LEVELS.includes(value as LogLevel);
}

function validateConfig(raw: Record<string, unknown>): BakendConfig {
  const port = raw.port ?? DEFAULT_CONFIG.port;
  const database = raw.database ?? DEFAULT_CONFIG.database;
  const storage = raw.storage ?? DEFAULT_CONFIG.storage;
  const logLevel = raw.logLevel ?? DEFAULT_CONFIG.logLevel;

  if (typeof port !== "number" || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid config: port must be an integer between 1 and 65535, got ${String(port)}`);
  }

  if (typeof database !== "string" || database.trim().length === 0) {
    throw new Error("Invalid config: database must be a non-empty string");
  }

  if (typeof storage !== "string" || storage.trim().length === 0) {
    throw new Error("Invalid config: storage must be a non-empty string");
  }

  if (!isLogLevel(logLevel)) {
    throw new Error(`Invalid config: logLevel must be one of ${LOG_LEVELS.join(", ")}`);
  }

  return {
    port,
    database,
    storage,
    logLevel,
  };
}

function applyEnvOverrides(config: BakendConfig): BakendConfig {
  const next = { ...config };

  const port = process.env.BAKEND_PORT;
  if (port !== undefined) {
    const parsed = Number.parseInt(port, 10);
    if (Number.isNaN(parsed)) {
      throw new Error(`Invalid BAKEND_PORT environment variable: ${port}`);
    }
    next.port = parsed;
  }

  const database = process.env.BAKEND_DATABASE;
  if (database !== undefined) {
    next.database = database;
  }

  const storage = process.env.BAKEND_STORAGE;
  if (storage !== undefined) {
    next.storage = storage;
  }

  const logLevel = process.env.BAKEND_LOG_LEVEL;
  if (logLevel !== undefined) {
    if (!isLogLevel(logLevel)) {
      throw new Error(`Invalid BAKEND_LOG_LEVEL environment variable: ${logLevel}`);
    }
    next.logLevel = logLevel;
  }

  return validateConfig(next);
}

export function loadConfig(options: LoadConfigOptions = {}): BakendConfig {
  const configPath = options.configPath ?? DEFAULT_CONFIG_PATH;
  let base: Record<string, unknown> = { ...DEFAULT_CONFIG };

  if (existsSync(configPath)) {
    let raw: string;

    try {
      raw = readFileSync(configPath, "utf8");
    } catch (error) {
      throw new Error(`Failed to read config file at ${configPath}: ${String(error)}`);
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("config root must be an object");
      }
      base = { ...DEFAULT_CONFIG, ...parsed };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in config file at ${configPath}: ${error.message}`);
      }
      throw error;
    }
  }

  return applyEnvOverrides(validateConfig(base));
}
