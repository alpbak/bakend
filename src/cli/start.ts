import type { Database } from "bun:sqlite";
import { loadConfig } from "../core/config/load.ts";
import type { LoadConfigOptions } from "../core/config/types.ts";
import { closeDatabase, initDatabase } from "../core/database/init.ts";
import { createLogger } from "../core/logging/logger.ts";
import { createServer } from "../core/server/create-server.ts";
import type { BakendServer } from "../core/server/create-server.ts";
import { VERSION_DISPLAY } from "../version.ts";

export interface StartOptions extends LoadConfigOptions {}

export interface StartResult {
  config: ReturnType<typeof loadConfig>;
  db: Database;
  server: BakendServer;
  shutdown: () => void;
}

export function printStartupBanner(port: number): void {
  console.log(`Bakend v${VERSION_DISPLAY}`);
  console.log("");
  console.log("Database: ready");
  console.log("API: ready");
  console.log("");
  console.log(`Listening on :${port}`);
}

export async function start(options: StartOptions = {}): Promise<StartResult> {
  const config = loadConfig(options);
  const logger = createLogger(config.logLevel);
  const db = initDatabase(config, logger);
  const server = createServer(config, logger);

  printStartupBanner(server.port);

  let shuttingDown = false;

  const shutdown = () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logger.info("Shutting down");
    server.stop();
    closeDatabase(db);
  };

  const handleSignal = () => {
    shutdown();
    process.exit(0);
  };

  process.on("SIGINT", handleSignal);
  process.on("SIGTERM", handleSignal);

  return {
    config,
    db,
    server,
    shutdown,
  };
}
