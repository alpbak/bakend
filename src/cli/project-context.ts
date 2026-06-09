import type { Database } from "bun:sqlite";
import { join } from "node:path";
import { loadProjectConfig } from "../core/config/load-project.ts";
import type { LoadConfigOptions } from "../core/config/types.ts";
import { createCollectionsEngine } from "../core/collections/create-collections-engine.ts";
import type { CollectionsEngine } from "../core/collections/types.ts";
import { closeDatabase, initDatabase } from "../core/database/init.ts";
import { createEventBus } from "../core/events/create-event-bus.ts";
import { createLogger } from "../core/logging/logger.ts";
import type { Logger } from "../core/logging/logger.ts";
import { createFunctionsEngine } from "../core/functions/create-functions-engine.ts";
import type { FunctionsEngine } from "../core/functions/types.ts";
import { createStorageEngine } from "../core/storage/create-storage-engine.ts";
import type { StorageEngine } from "../core/storage/types.ts";
import { createJobsEngine } from "../core/jobs/create-jobs-engine.ts";
import type { JobsEngine } from "../core/jobs/types.ts";
import { warnIfInsecureProductionConfig } from "./security-check.ts";

export interface ProjectContext {
  configPath: string;
  projectDir: string;
  config: ReturnType<typeof loadProjectConfig>["config"];
  logger: Logger;
  db: Database;
  collections: CollectionsEngine;
  storage: StorageEngine;
  functions: FunctionsEngine;
  jobs: JobsEngine;
  collectionsDir: string;
  functionsDir: string;
  jobsDir: string;
  close: () => void;
}

export interface OpenProjectOptions extends LoadConfigOptions {
  loadFunctions?: boolean;
  loadJobs?: boolean;
}

export async function openProject(options: OpenProjectOptions = {}): Promise<ProjectContext> {
  const { configPath, projectDir, config } = loadProjectConfig(options);
  warnIfInsecureProductionConfig(config);
  const logger = createLogger(config.logLevel, 500, config.logFile);
  const eventBus = createEventBus(logger);
  const db = initDatabase(config, logger);
  const storage = createStorageEngine({ db, config, logger, eventBus });
  const collections = createCollectionsEngine({ db, logger, eventBus, storage });
  const collectionsDir = join(projectDir, "collections");
  const functionsDir = join(projectDir, "functions");
  const jobsDir = join(projectDir, "jobs");

  const functions = createFunctionsEngine({
    eventBus,
    db,
    logger,
    functionsDir,
    watch: false,
    storage,
  });

  const jobs = createJobsEngine({
    eventBus,
    db,
    logger,
    jobsDir,
    watch: false,
    storage,
  });

  if (options.loadFunctions !== false) {
    await functions.load();
  }

  if (options.loadJobs !== false) {
    await jobs.load();
  }

  return {
    configPath,
    projectDir,
    config,
    logger,
    db,
    collections,
    storage,
    functions,
    jobs,
    collectionsDir,
    functionsDir,
    jobsDir,
    close: () => {
      jobs.shutdown();
      functions.shutdown();
      closeDatabase(db);
      logger.close?.();
    },
  };
}
