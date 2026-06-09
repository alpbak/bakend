import type { AuthContext } from "../../auth/types.ts";
import type { AuthEngine } from "../../auth/types.ts";
import type { CollectionsEngine } from "../../collections/types.ts";
import type { FunctionsEngine } from "../../functions/types.ts";
import type { JobsEngine } from "../../jobs/types.ts";
import type { Logger } from "../../logging/logger.ts";
import type { StorageEngine } from "../../storage/types.ts";
import { jsonOk, methodNotAllowedResponse } from "../responses.ts";
import {
  handleAdminCreateCollection,
  handleAdminDeleteCollection,
  handleAdminGetCollection,
  handleAdminListCollections,
  handleAdminUpdateCollection,
} from "./handlers/collections.ts";
import { handleAdminListFunctions } from "./handlers/functions.ts";
import { handleAdminJobRuns, handleAdminListJobs } from "./handlers/jobs.ts";
import { handleAdminListLogs } from "./handlers/logs.ts";
import { handleAdminListStorage } from "./handlers/storage.ts";
import {
  handleAdminDeleteUser,
  handleAdminListUsers,
  handleAdminUpdateUser,
} from "./handlers/users.ts";
import { requireAdmin } from "./require-admin.ts";

export interface AdminRouterContext {
  collections: CollectionsEngine;
  auth: AuthEngine;
  storage: StorageEngine;
  functions: FunctionsEngine;
  jobs: JobsEngine;
  logger: Logger;
  authContext: AuthContext | null;
}

interface AdminRouteMatch {
  resource: string;
  id?: string;
  subResource?: string;
}

function matchAdminRoute(pathname: string): AdminRouteMatch | null {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 3 || segments[0] !== "api" || segments[1] !== "admin") {
    return null;
  }

  const resource = segments[2];
  if (!resource) {
    return null;
  }

  if (segments.length === 3) {
    return { resource };
  }

  if (segments.length === 4) {
    return { resource, id: segments[3] };
  }

  if (segments.length === 5) {
    return { resource, id: segments[3], subResource: segments[4] };
  }

  return null;
}

export function handleAuthMeRequest(
  context: Pick<AdminRouterContext, "auth" | "authContext">,
  request: Request,
): Response | null {
  const url = new URL(request.url);
  if (url.pathname !== "/api/auth/me") {
    return null;
  }

  if (request.method !== "GET") {
    return methodNotAllowedResponse();
  }

  if (!context.authContext) {
    return Response.json({ error: { code: "unauthorized", message: "Authentication required" } }, {
      status: 401,
    });
  }

  return jsonOk({ user: context.authContext.user });
}

export async function handleAdminRequest(
  request: Request,
  context: AdminRouterContext,
): Promise<Response | null> {
  const url = new URL(request.url);
  const route = matchAdminRoute(url.pathname);

  if (!route) {
    return null;
  }

  const denied = requireAdmin(context.authContext);
  if (denied) {
    return denied;
  }

  context.logger.debug(`${request.method} ${url.pathname}`);

  switch (route.resource) {
    case "collections": {
      if (!route.id) {
        if (request.method === "GET") {
          return handleAdminListCollections(context);
        }
        if (request.method === "POST") {
          return handleAdminCreateCollection(context, request);
        }
        return methodNotAllowedResponse();
      }

      if (request.method === "GET") {
        return handleAdminGetCollection(context, route.id);
      }
      if (request.method === "PUT") {
        return handleAdminUpdateCollection(context, route.id, request);
      }
      if (request.method === "DELETE") {
        return handleAdminDeleteCollection(context, route.id, request);
      }
      return methodNotAllowedResponse();
    }

    case "users": {
      if (!route.id) {
        if (request.method === "GET") {
          return handleAdminListUsers(context, request);
        }
        return methodNotAllowedResponse();
      }

      if (request.method === "PATCH") {
        return handleAdminUpdateUser(context, route.id, request);
      }
      if (request.method === "DELETE") {
        return handleAdminDeleteUser(context, route.id, request);
      }
      return methodNotAllowedResponse();
    }

    case "storage": {
      if (route.id || request.method !== "GET") {
        return methodNotAllowedResponse();
      }
      return handleAdminListStorage(context, request);
    }

    case "functions": {
      if (route.id || request.method !== "GET") {
        return methodNotAllowedResponse();
      }
      return handleAdminListFunctions(context);
    }

    case "jobs": {
      if (!route.id) {
        if (request.method === "GET") {
          return handleAdminListJobs(context);
        }
        return methodNotAllowedResponse();
      }

      if (route.subResource === "runs" && request.method === "GET") {
        return handleAdminJobRuns(context, route.id);
      }

      return methodNotAllowedResponse();
    }

    case "logs": {
      if (route.id || request.method !== "GET") {
        return methodNotAllowedResponse();
      }
      return handleAdminListLogs(context, request);
    }

    default:
      return Response.json({ error: { code: "not_found", message: "Not found" } }, {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
  }
}
