import type { AuthEngine } from "../auth/types.ts";
import type { AuthContext } from "../auth/types.ts";
import type { BakendConfig } from "../config/types.ts";
import type { Logger } from "../logging/logger.ts";
import type { CollectionsEngine } from "../collections/types.ts";
import type { RecordStore } from "../collections/record-store.ts";
import type { StorageEngine } from "../storage/types.ts";
import type { FunctionsEngine } from "../functions/types.ts";
import type { JobsEngine } from "../jobs/types.ts";
import type { RealtimeEngine } from "../realtime/types.ts";
import type { RealtimeConnectionData } from "../realtime/types.ts";
import { handleApiRequest } from "../api/router.ts";
import { handleDashboardRequest } from "./serve-dashboard.ts";

export interface BakendServer {
  port: number;
  stop: () => void;
}

export interface CreateServerOptions {
  collections: CollectionsEngine;
  recordStore: RecordStore;
  auth: AuthEngine;
  storage: StorageEngine;
  functions: FunctionsEngine;
  jobs: JobsEngine;
  realtime: RealtimeEngine;
}

async function resolveRealtimeAuth(
  request: Request,
  auth: AuthEngine,
): Promise<AuthContext | null> {
  const authContext = await auth.resolveAuthContext(request);
  if (authContext) {
    return authContext;
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return null;
  }

  const user = await auth.validateAccessToken(token);
  return user ? { user } : null;
}

export function createServer(
  config: BakendConfig,
  logger: Logger,
  options: CreateServerOptions,
): BakendServer {
  const server = Bun.serve<RealtimeConnectionData>({
    port: config.port,
    async fetch(request, bunServer) {
      const url = new URL(request.url);

      if (url.pathname === "/api/realtime") {
        if (request.method !== "GET") {
          return new Response("Method Not Allowed", { status: 405 });
        }

        const authContext = await resolveRealtimeAuth(request, options.auth);
        const upgraded = bunServer.upgrade(request, {
          data: {
            clientId: "",
            authContext,
            subscriptions: new Set(),
          },
        });

        if (upgraded) {
          return undefined;
        }

        return new Response("WebSocket upgrade failed", { status: 400 });
      }

      const dashboardResponse = handleDashboardRequest(request, config.dashboard.enabled, logger);
      if (dashboardResponse) {
        return dashboardResponse;
      }

      const authContext = await options.auth.resolveAuthContext(request);

      return handleApiRequest(request, {
        collections: options.collections,
        recordStore: options.recordStore,
        auth: options.auth,
        storage: options.storage,
        functions: options.functions,
        jobs: options.jobs,
        authContext,
        logger,
      });
    },
    websocket: {
      open(ws) {
        options.realtime.handleOpen(ws);
      },
      message(ws, message) {
        options.realtime.handleMessage(ws, String(message));
      },
      close(ws) {
        options.realtime.handleClose(ws);
      },
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
