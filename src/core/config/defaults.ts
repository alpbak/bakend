import type { BakendConfig } from "./types.ts";

export const DEFAULT_CONFIG_PATH = "./bakend.json";

export const DEFAULT_CONFIG: BakendConfig = {
  port: 8080,
  database: "./bakend.db",
  storage: "./storage",
  logLevel: "INFO",
};
