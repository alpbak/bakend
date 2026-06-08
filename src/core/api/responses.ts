import type { ValidationError } from "../collections/types.ts";
import type { ApiErrorBody, ApiErrorResponse } from "./types.ts";

export function jsonOk(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export function jsonError(code: string, message: string, status: number, details?: ValidationError[]): Response {
  const error: ApiErrorBody = { code, message };
  if (details && details.length > 0) {
    error.details = details;
  }

  const body: ApiErrorResponse = { error };
  return Response.json(body, { status });
}

export function validationErrorResponse(errors: ValidationError[]): Response {
  return jsonError("validation_error", "Validation failed", 400, errors);
}

export function notFoundResponse(message: string): Response {
  return jsonError("not_found", message, 404);
}

export function badRequestResponse(message: string): Response {
  return jsonError("bad_request", message, 400);
}

export function methodNotAllowedResponse(): Response {
  return jsonError("method_not_allowed", "Method not allowed", 405);
}

export async function parseJsonBody(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error("Content-Type must be application/json");
  }

  try {
    const body = (await request.json()) as unknown;

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new Error("Request body must be a JSON object");
    }

    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Content-Type")) {
      throw error;
    }
    if (error instanceof Error && error.message.startsWith("Request body")) {
      throw error;
    }
    throw new Error("Invalid JSON body");
  }
}
