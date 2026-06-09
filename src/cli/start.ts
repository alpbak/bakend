import type { Database } from "bun:sqlite";
import { dirname, join, resolve } from "node:path";
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
import { createAuthEngine } from "../core/auth/create-auth-engine.ts";
import type { AuthEngine } from "../core/auth/types.ts";
import { createStorageEngine } from "../core/storage/create-storage-engine.ts";
import type { StorageEngine } from "../core/storage/types.ts";
import { getAdminEmailFromEnv } from "../core/config/load.ts";
import { createJobsEngine } from "../core/jobs/create-jobs-engine.ts";
import type { JobsEngine } from "../core/jobs/types.ts";
import { createRealtimeEngine } from "../core/realtime/create-realtime-engine.ts";
import type { RealtimeEngine } from "../core/realtime/types.ts";
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
  auth: AuthEngine;
  storage: StorageEngine;
  functions: FunctionsEngine;
  jobs: JobsEngine;
  realtime: RealtimeEngine;
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
  const configPath = resolve(options.configPath ?? DEFAULT_CONFIG_PATH);
  const config = loadConfig({ ...options, configPath });
  const logger = createLogger(config.logLevel);
  const eventBus = createEventBus(logger);
  const db = initDatabase(config, logger);
  const storage = createStorageEngine({ db, config, logger, eventBus });
  const collections = createCollectionsEngine({ db, logger, eventBus, storage });
  const recordStore = createRecordStore({ db, collections, logger, eventBus });

  const projectDir = dirname(configPath);
  const collectionsDir = join(projectDir, "collections");
  const functionsDir = join(projectDir, "functions");
  const jobsDir = join(projectDir, "jobs");

  loadCollectionDefinitions(collections, collectionsDir, logger);

  const watch = options.watch ?? false;

  const auth = createAuthEngine({
    db,
    logger,
    eventBus,
    config,
    adminEmail: getAdminEmailFromEnv(),
  });

  const functions = createFunctionsEngine({
    eventBus,
    db,
    logger,
    functionsDir,
    watch,
    storage,
  });
  await functions.load();

  const jobs = createJobsEngine({
    eventBus,
    db,
    logger,
    jobsDir,
    watch,
    storage,
  });
  await jobs.load();

  const realtime = createRealtimeEngine({ eventBus, collections, logger });
  const server = createServer(config, logger, {
    collections,
    recordStore,
    auth,
    storage,
    functions,
    jobs,
    realtime,
  });

  printStartupBanner(server.port);

  let shuttingDown = false;

  const shutdown = () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logger.info("Shutting down");
    jobs.shutdown();
    functions.shutdown();
    realtime.shutdown();
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
    auth,
    storage,
    functions,
    jobs,
    realtime,
    shutdown,
  };
}
