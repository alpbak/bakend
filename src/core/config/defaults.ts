import type { BakendConfig } from "./types.ts";

export const DEFAULT_CONFIG_PATH = "./bakend.json";

export const DEFAULT_AUTH_JWT_SECRET = "dev-only-change-me";

export const DEFAULT_CONFIG: BakendConfig = {
  port: 8080,
  database: "./bakend.db",
  storage: "./storage",
  logLevel: "INFO",
  auth: {
    jwtSecret: DEFAULT_AUTH_JWT_SECRET,
    accessTokenTtl: "15m",
    refreshTokenTtl: "7d",
  },
};
