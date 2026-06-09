import type { AuthEngine } from "../../auth/types.ts";
import { AuthError } from "../../auth/types.ts";
import type { Logger } from "../../logging/logger.ts";
import {
  badRequestResponse,
  conflictResponse,
  jsonOk,
  methodNotAllowedResponse,
  parseJsonBody,
  unauthorizedResponse,
} from "../responses.ts";

export interface AuthHandlerContext {
  auth: AuthEngine;
  logger: Logger;
}

function getStringField(body: Record<string, unknown>, field: string): string | null {
  const value = body[field];
  return typeof value === "string" ? value : null;
}

function handleAuthError(error: unknown): Response {
  if (error instanceof AuthError) {
    if (error.status === 409) {
      return conflictResponse(error.message);
    }
    return unauthorizedResponse(error.message);
  }
  throw error;
}

export async function handleAuthRoute(
  context: AuthHandlerContext,
  action: string,
  request: Request,
): Promise<Response> {
  if (request.method !== "POST") {
    return methodNotAllowedResponse();
  }

  let body: Record<string, unknown>;
  try {
    body = await parseJsonBody(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body";
    return badRequestResponse(message);
  }

  try {
    switch (action) {
      case "register": {
        const email = getStringField(body, "email");
        const password = getStringField(body, "password");
        if (!email || !password) {
          return badRequestResponse("email and password are required");
        }
        const tokens = await context.auth.register(email, password);
        return jsonOk(tokens, 201);
      }
      case "login": {
        const email = getStringField(body, "email");
        const password = getStringField(body, "password");
        if (!email || !password) {
          return badRequestResponse("email and password are required");
        }
        const tokens = await context.auth.login(email, password);
        return jsonOk(tokens);
      }
      case "refresh": {
        const refreshToken = getStringField(body, "refreshToken");
        if (!refreshToken) {
          return badRequestResponse("refreshToken is required");
        }
        const tokens = await context.auth.refresh(refreshToken);
        return jsonOk(tokens);
      }
      case "logout": {
        const refreshToken = getStringField(body, "refreshToken");
        if (!refreshToken) {
          return badRequestResponse("refreshToken is required");
        }
        await context.auth.logout(refreshToken);
        return new Response(null, { status: 204 });
      }
      default:
        return new Response(JSON.stringify({ error: { code: "not_found", message: "Not found" } }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    return handleAuthError(error);
  }
}
