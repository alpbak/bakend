import type { Database } from "bun:sqlite";
import { dirname, join } from "node:path";
import { loadConfig } from "../core/config/load.ts";
import { DEFAULT_CONFIG_PATH } from "../core/config/defaults.ts";
import type { LoadConfigOptions } from "../core/config/types.ts";
import { createCollectionsEngine } from "../core/collections/create-collections-engine.ts";
import { loadCollectionDefinitions } from "../core/collections/load-definitions.ts";
import type { CollectionsEngine } from "../core/collections/types.ts";
import { createRecordStore } from "../core/collections/record-store.ts";
import type { RecordStore } from "../core/collections/record-store.ts";
import { closeDatabase, initDatabase } from "../core/database/init.ts";
import { createEventBus } from "../core/events/create-event-bus.ts";
import type { EventBus } from "../core/events/types.ts";
import { createLogger } from "../core/logging/logger.ts";
import { createFunctionsEngine } from "../core/functions/create-functions-engine.ts";
import type { FunctionsEngine } from "../core/functions/types.ts";
import { createServer } from "../core/server/create-server.ts";
import type { BakendServer } from "../core/server/create-server.ts";
import { VERSION_DISPLAY } from "../version.ts";

export interface StartOptions extends LoadConfigOptions {
  watch?: boolean;
}

export interface StartResult {
  config: ReturnType<typeof loadConfig>;
  db: Database;
  server: BakendServer;
  eventBus: EventBus;
  collections: CollectionsEngine;
  recordStore: RecordStore;
  functions: FunctionsEngine;
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
  const eventBus = createEventBus(logger);
  const db = initDatabase(config, logger);
  const collections = createCollectionsEngine({ db, logger, eventBus });
  const recordStore = createRecordStore({ db, collections, logger, eventBus });

  const configPath = options.configPath ?? DEFAULT_CONFIG_PATH;
  const projectDir = dirname(configPath);
  const collectionsDir = join(projectDir, "collections");
  const functionsDir = join(projectDir, "functions");

  loadCollectionDefinitions(collections, collectionsDir, logger);

  const functions = createFunctionsEngine({
    eventBus,
    db,
    logger,
    functionsDir,
    watch: options.watch ?? false,
  });
  await functions.load();

  const server = createServer(config, logger, { collections, recordStore });

  printStartupBanner(server.port);

  let shuttingDown = false;

  const shutdown = () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logger.info("Shutting down");
    functions.shutdown();
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
    eventBus,
    collections,
    recordStore,
    functions,
    shutdown,
  };
}
