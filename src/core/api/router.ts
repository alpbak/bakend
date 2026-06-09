import type { AuthEngine } from "../auth/types.ts";
import type { Logger } from "../logging/logger.ts";
import type { CollectionsEngine } from "../collections/types.ts";
import type { RecordStore } from "../collections/record-store.ts";
import type { AuthContext } from "../auth/types.ts";
import type { StorageEngine } from "../storage/types.ts";
import { handleAuthRoute } from "./handlers/auth.ts";
import { handleCollectionRoute, handleRecordRoute } from "./handlers/records.ts";
import {
  handleStorageFileRoute,
  handleStorageUpload,
} from "./handlers/storage.ts";
import { handleHealthRequest } from "../server/routes.ts";

export interface ApiRouterContext {
  collections: CollectionsEngine;
  recordStore: RecordStore;
  auth: AuthEngine;
  storage: StorageEngine;
  authContext: AuthContext | null;
  logger: Logger;
}

interface ApiRouteMatch {
  collection: string;
  id?: string;
}

interface AuthRouteMatch {
  action: string;
}

interface StorageRouteMatch {
  action: "upload" | "file";
  fileId?: string;
}

function matchAuthRoute(pathname: string): AuthRouteMatch | null {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length !== 3 || segments[0] !== "api" || segments[1] !== "auth") {
    return null;
  }

  const action = segments[2];
  if (!action) {
    return null;
  }

  return { action };
}

function matchStorageRoute(pathname: string): StorageRouteMatch | null {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 3 || segments[0] !== "api" || segments[1] !== "storage") {
    return null;
  }

  if (segments.length === 3 && segments[2] === "upload") {
    return { action: "upload" };
  }

  if (segments.length === 3 && segments[2]) {
    return { action: "file", fileId: segments[2] };
  }

  return null;
}

function matchApiRoute(pathname: string): ApiRouteMatch | null {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 2 || segments[0] !== "api") {
    return null;
  }

  const collection = segments[1];
  if (!collection || collection === "auth" || collection === "storage") {
    return null;
  }

  if (segments.length === 2) {
    return { collection };
  }

  if (segments.length === 3) {
    return { collection, id: segments[2] };
  }

  return null;
}

export async function handleApiRequest(
  request: Request,
  context: ApiRouterContext,
): Promise<Response> {
  const url = new URL(request.url);

  const healthResponse = handleHealthRequest(request, context.logger);
  if (healthResponse) {
    return healthResponse;
  }

  const authRoute = matchAuthRoute(url.pathname);
  if (authRoute) {
    context.logger.debug(`${request.method} ${url.pathname}`);
    return handleAuthRoute(context, authRoute.action, request);
  }

  const storageRoute = matchStorageRoute(url.pathname);
  if (storageRoute) {
    context.logger.debug(`${request.method} ${url.pathname}`);

    const storageContext = {
      storage: context.storage,
      authContext: context.authContext,
      logger: context.logger,
    };

    if (storageRoute.action === "upload") {
      return handleStorageUpload(storageContext, request);
    }

    if (storageRoute.fileId) {
      return handleStorageFileRoute(storageContext, storageRoute.fileId, request);
    }
  }

  const route = matchApiRoute(url.pathname);
  if (!route) {
    return new Response(JSON.stringify({ error: { code: "not_found", message: "Not found" } }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (route.collection === "users") {
    return new Response(JSON.stringify({ error: { code: "not_found", message: "Not found" } }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  context.logger.debug(`${request.method} ${url.pathname}`);

  if (route.id) {
    return handleRecordRoute(context, route.collection, route.id, request);
  }

  return handleCollectionRoute(context, route.collection, request);
}
