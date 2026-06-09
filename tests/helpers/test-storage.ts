import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Database } from "bun:sqlite";
import { createStorageEngine } from "../../src/core/storage/create-storage-engine.ts";
import type { StorageEngine } from "../../src/core/storage/types.ts";
import { DEFAULT_CONFIG } from "../../src/core/config/defaults.ts";
import type { EventBus } from "../../src/core/events/types.ts";
import type { Logger } from "../../src/core/logging/logger.ts";

export function createTestStorage(
  db: Database,
  logger: Logger,
  eventBus: EventBus,
  storageRoot?: string,
): { storage: StorageEngine; storageRoot: string } {
  const root = storageRoot ?? mkdtempSync(join(tmpdir(), "bakend-storage-"));
  const config = {
    ...DEFAULT_CONFIG,
    storage: root,
  };

  const storage = createStorageEngine({ db, config, logger, eventBus });

  return { storage, storageRoot: root };
}
