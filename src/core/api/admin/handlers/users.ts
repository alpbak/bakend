import { AuthError } from "../../../auth/types.ts";
import type { AuthEngine } from "../../../auth/types.ts";
import { USER_ROLES, type UserRole } from "../../../auth/types.ts";
import {
  badRequestResponse,
  jsonOk,
  methodNotAllowedResponse,
  notFoundResponse,
  parseJsonBody,
} from "../../responses.ts";

export interface AdminUsersContext {
  auth: AuthEngine;
}

function parsePagination(url: URL): { limit: number; offset: number } {
  const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1), 100);
  const offset = Math.max(Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);
  return { limit, offset };
}

function handleAuthError(error: unknown): Response {
  if (error instanceof AuthError) {
    if (error.status === 404) {
      return notFoundResponse(error.message);
    }
    return badRequestResponse(error.message);
  }
  throw error;
}

export function handleAdminListUsers(context: AdminUsersContext, request: Request): Response {
  const url = new URL(request.url);
  const { limit, offset } = parsePagination(url);
  const result = context.auth.listUsers(limit, offset);
  return jsonOk(result);
}

export async function handleAdminUpdateUser(
  context: AdminUsersContext,
  userId: string,
  request: Request,
): Promise<Response> {
  if (request.method !== "PATCH") {
    return methodNotAllowedResponse();
  }

  let body: Record<string, unknown>;
  try {
    body = await parseJsonBody(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body";
    return badRequestResponse(message);
  }

  const role = body.role;
  if (typeof role !== "string" || !USER_ROLES.includes(role as UserRole)) {
    return badRequestResponse(`role must be one of: ${USER_ROLES.join(", ")}`);
  }

  try {
    const user = await context.auth.updateUserRole(userId, role as UserRole);
    return jsonOk(user);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function handleAdminDeleteUser(
  context: AdminUsersContext,
  userId: string,
  request: Request,
): Promise<Response> {
  if (request.method !== "DELETE") {
    return methodNotAllowedResponse();
  }

  try {
    await context.auth.deleteUser(userId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleAuthError(error);
  }
}
