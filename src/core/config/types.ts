import type { LogLevel } from "../logging/types.ts";

export interface AuthConfig {
  jwtSecret: string;
  accessTokenTtl: string;
  refreshTokenTtl: string;
}

export interface BakendConfig {
  port: number;
  database: string;
  storage: string;
  logLevel: LogLevel;
  auth: AuthConfig;
}

export interface LoadConfigOptions {
  configPath?: string;
}
