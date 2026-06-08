import type { LogLevel } from "../logging/types.ts";

export interface BakendConfig {
  port: number;
  database: string;
  storage: string;
  logLevel: LogLevel;
}

export interface LoadConfigOptions {
  configPath?: string;
}
