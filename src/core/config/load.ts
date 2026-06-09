import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { LOG_LEVELS } from "../logging/types.ts";
import type { LogLevel } from "../logging/types.ts";
import { DEFAULT_CONFIG, DEFAULT_CONFIG_PATH } from "./defaults.ts";
import type { AuthConfig, BakendConfig, DashboardConfig, LoadConfigOptions } from "./types.ts";

function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === "string" && LOG_LEVELS.includes(value as LogLevel);
}

const DURATION_PATTERN = /^(\d+)([smhd])$/;

function isDuration(value: unknown): value is string {
  return typeof value === "string" && DURATION_PATTERN.test(value);
}

function validateAuthConfig(raw: unknown): AuthConfig {
  const defaults = DEFAULT_CONFIG.auth;
  const source =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const jwtSecret =
    typeof source.jwtSecret === "string" && source.jwtSecret.trim().length > 0
      ? source.jwtSecret
      : defaults.jwtSecret;

  const accessTokenTtl = source.accessTokenTtl ?? defaults.accessTokenTtl;
  const refreshTokenTtl = source.refreshTokenTtl ?? defaults.refreshTokenTtl;

  if (!isDuration(accessTokenTtl)) {
    throw new Error(
      'Invalid config: auth.accessTokenTtl must be a duration like "15m", "1h", or "7d"',
    );
  }

  if (!isDuration(refreshTokenTtl)) {
    throw new Error(
      'Invalid config: auth.refreshTokenTtl must be a duration like "15m", "1h", or "7d"',
    );
  }

  return {
    jwtSecret,
    accessTokenTtl,
    refreshTokenTtl,
  };
}

function validateDashboardConfig(raw: unknown): DashboardConfig {
  const defaults = DEFAULT_CONFIG.dashboard;
  const source =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const enabled = source.enabled ?? defaults.enabled;

  if (typeof enabled !== "boolean") {
    throw new Error("Invalid config: dashboard.enabled must be a boolean");
  }

  return { enabled };
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
    auth: validateAuthConfig(raw.auth),
    dashboard: validateDashboardConfig(raw.dashboard),
  };
}

function applyEnvOverrides(config: BakendConfig): BakendConfig {
  const next = { ...config, auth: { ...config.auth }, dashboard: { ...config.dashboard } };

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

  const jwtSecret = process.env.BAKEND_AUTH_JWT_SECRET;
  if (jwtSecret !== undefined) {
    if (jwtSecret.trim().length === 0) {
      throw new Error("Invalid BAKEND_AUTH_JWT_SECRET environment variable: must be non-empty");
    }
    next.auth.jwtSecret = jwtSecret;
  }

  const dashboardEnabled = process.env.BAKEND_DASHBOARD_ENABLED;
  if (dashboardEnabled !== undefined) {
    if (dashboardEnabled === "true") {
      next.dashboard = { enabled: true };
    } else if (dashboardEnabled === "false") {
      next.dashboard = { enabled: false };
    } else {
      throw new Error(
        "Invalid BAKEND_DASHBOARD_ENABLED environment variable: must be 'true' or 'false'",
      );
    }
  }

  return validateConfig({ ...next, auth: next.auth, dashboard: next.dashboard });
}

export function getAdminEmailFromEnv(): string | undefined {
  const email = process.env.BAKEND_ADMIN_EMAIL;
  return email && email.trim().length > 0 ? email.trim().toLowerCase() : undefined;
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
