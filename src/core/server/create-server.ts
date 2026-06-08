import type { BakendConfig } from "../config/types.ts";
import type { Logger } from "../logging/logger.ts";
import { handleRequest } from "./routes.ts";

export interface BakendServer {
  port: number;
  stop: () => void;
}

export function createServer(config: BakendConfig, logger: Logger): BakendServer {
  const server = Bun.serve({
    port: config.port,
    fetch(request) {
      return handleRequest(request, logger);
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
