import type { BakendConfig } from "../config/types.ts";
import type { Logger } from "../logging/logger.ts";
import type { CollectionsEngine } from "../collections/types.ts";
import type { RecordStore } from "../collections/record-store.ts";
import { handleApiRequest } from "../api/router.ts";

export interface BakendServer {
  port: number;
  stop: () => void;
}

export interface CreateServerOptions {
  collections: CollectionsEngine;
  recordStore: RecordStore;
}

export function createServer(
  config: BakendConfig,
  logger: Logger,
  options: CreateServerOptions,
): BakendServer {
  const server = Bun.serve({
    port: config.port,
    fetch(request) {
      return handleApiRequest(request, {
        collections: options.collections,
        recordStore: options.recordStore,
        logger,
      });
    },
  });

  if (server.port === undefined) {
    throw new Error("Failed to determine HTTP server port");
  }

  logger.debug(`HTTP server listening on port ${server.port}`);

  return {
    port: server.port,
    stop: () => {
      server.stop(true);
    },
  };
}
