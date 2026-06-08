import type { Logger } from "../logging/logger.ts";
import type { CollectionsEngine } from "../collections/types.ts";
import type { RecordStore } from "../collections/record-store.ts";
import { handleCollectionRoute, handleRecordRoute } from "./handlers/records.ts";
import { handleHealthRequest } from "../server/routes.ts";

export interface ApiRouterContext {
  collections: CollectionsEngine;
  recordStore: RecordStore;
  logger: Logger;
}

interface ApiRouteMatch {
  collection: string;
  id?: string;
}

function matchApiRoute(pathname: string): ApiRouteMatch | null {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 2 || segments[0] !== "api") {
    return null;
  }

  const collection = segments[1];
  if (!collection) {
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

export function handleApiRequest(request: Request, context: ApiRouterContext): Response | Promise<Response> {
  const url = new URL(request.url);

  const healthResponse = handleHealthRequest(request, context.logger);
  if (healthResponse) {
    return healthResponse;
  }

  const route = matchApiRoute(url.pathname);
  if (!route) {
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
