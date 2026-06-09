import type { AuthContext } from "../../auth/types.ts";
import {
  checkCollectionPermission,
  getPermissionRule,
  hasOwnerField,
  isAdmin,
  OWNER_FIELD_NAME,
  shouldFilterListByOwner,
} from "../../auth/permissions.ts";
import type { Logger } from "../../logging/logger.ts";
import type { CollectionsEngine } from "../../collections/types.ts";
import {
  CollectionNotFoundError,
  RecordNotFoundError,
  RecordValidationError,
  type RecordStore,
} from "../../collections/record-store.ts";
import {
  badRequestResponse,
  forbiddenResponse,
  jsonOk,
  methodNotAllowedResponse,
  notFoundResponse,
  parseJsonBody,
  unauthorizedResponse,
  validationErrorResponse,
} from "../responses.ts";
import type { ListRecordsResponse } from "../types.ts";

export interface RecordHandlerContext {
  collections: CollectionsEngine;
  recordStore: RecordStore;
  authContext: AuthContext | null;
  logger: Logger;
}

function ensureCollectionExists(collections: CollectionsEngine, name: string): boolean {
  return collections.exists(name);
}

function getCollectionDefinition(collections: CollectionsEngine, name: string) {
  const meta = collections.get(name);
  if (!meta) {
    return null;
  }
  return meta.definition;
}

function denyUnlessAllowed(
  allowed: boolean,
  rule: string,
  authContext: AuthContext | null,
): Response | null {
  if (allowed) {
    return null;
  }

  if (!authContext && (rule === "authenticated" || rule === "owner" || rule === "admin")) {
    return unauthorizedResponse("Authentication required");
  }

  return forbiddenResponse("Insufficient permissions");
}

export function handleListRecords(
  context: RecordHandlerContext,
  collection: string,
): Response {
  if (!ensureCollectionExists(context.collections, collection)) {
    return notFoundResponse(`Collection "${collection}" does not exist`);
  }

  const definition = getCollectionDefinition(context.collections, collection);
  if (!definition) {
    return notFoundResponse(`Collection "${collection}" does not exist`);
  }

  const rule = getPermissionRule(definition, "read");
  const denied = denyUnlessAllowed(
    checkCollectionPermission(definition, "read", context.authContext),
    rule,
    context.authContext,
  );
  if (denied) {
    return denied;
  }

  const listOptions =
    shouldFilterListByOwner(definition) &&
    context.authContext &&
    !isAdmin(context.authContext)
      ? { userId: context.authContext.user.id }
      : undefined;

  const items = context.recordStore.list(collection, listOptions);
  const body: ListRecordsResponse = { items };
  return jsonOk(body);
}

export async function handleCreateRecord(
  context: RecordHandlerContext,
  collection: string,
  request: Request,
): Promise<Response> {
  if (!ensureCollectionExists(context.collections, collection)) {
    return notFoundResponse(`Collection "${collection}" does not exist`);
  }

  const definition = getCollectionDefinition(context.collections, collection);
  if (!definition) {
    return notFoundResponse(`Collection "${collection}" does not exist`);
  }

  const rule = getPermissionRule(definition, "create");
  const denied = denyUnlessAllowed(
    checkCollectionPermission(definition, "create", context.authContext),
    rule,
    context.authContext,
  );
  if (denied) {
    return denied;
  }

  let data: Record<string, unknown>;
  try {
    data = await parseJsonBody(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body";
    return badRequestResponse(message);
  }

  if (hasOwnerField(definition) && context.authContext) {
    data = { ...data, [OWNER_FIELD_NAME]: context.authContext.user.id };
  }

  try {
    const record = context.recordStore.create(collection, data);
    return jsonOk(record, 201);
  } catch (error) {
    if (error instanceof RecordValidationError) {
      return validationErrorResponse(error.errors);
    }
    throw error;
  }
}

export function handleGetRecord(
  context: RecordHandlerContext,
  collection: string,
  id: string,
): Response {
  if (!ensureCollectionExists(context.collections, collection)) {
    return notFoundResponse(`Collection "${collection}" does not exist`);
  }

  const definition = getCollectionDefinition(context.collections, collection);
  if (!definition) {
    return notFoundResponse(`Collection "${collection}" does not exist`);
  }

  try {
    const record = context.recordStore.get(collection, id);
    if (!record) {
      return notFoundResponse(`Record "${id}" not found`);
    }

    const rule = getPermissionRule(definition, "read");
    const denied = denyUnlessAllowed(
      checkCollectionPermission(definition, "read", context.authContext, record),
      rule,
      context.authContext,
    );
    if (denied) {
      return denied;
    }

    return jsonOk(record);
  } catch (error) {
    if (error instanceof CollectionNotFoundError) {
      return notFoundResponse(error.message);
    }
    throw error;
  }
}

export async function handleUpdateRecord(
  context: RecordHandlerContext,
  collection: string,
  id: string,
  request: Request,
): Promise<Response> {
  if (!ensureCollectionExists(context.collections, collection)) {
    return notFoundResponse(`Collection "${collection}" does not exist`);
  }

  const definition = getCollectionDefinition(context.collections, collection);
  if (!definition) {
    return notFoundResponse(`Collection "${collection}" does not exist`);
  }

  const existing = context.recordStore.get(collection, id);
  if (!existing) {
    return notFoundResponse(`Record "${id}" not found`);
  }

  const rule = getPermissionRule(definition, "update");
  const denied = denyUnlessAllowed(
    checkCollectionPermission(definition, "update", context.authContext, existing),
    rule,
    context.authContext,
  );
  if (denied) {
    return denied;
  }

  let data: Record<string, unknown>;
  try {
    data = await parseJsonBody(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body";
    return badRequestResponse(message);
  }

  try {
    const record = context.recordStore.update(collection, id, data);
    return jsonOk(record);
  } catch (error) {
    if (error instanceof RecordValidationError) {
      return validationErrorResponse(error.errors);
    }
    if (error instanceof RecordNotFoundError) {
      return notFoundResponse(error.message);
    }
    throw error;
  }
}

export function handleDeleteRecord(
  context: RecordHandlerContext,
  collection: string,
  id: string,
): Response {
  if (!ensureCollectionExists(context.collections, collection)) {
    return notFoundResponse(`Collection "${collection}" does not exist`);
  }

  const definition = getCollectionDefinition(context.collections, collection);
  if (!definition) {
    return notFoundResponse(`Collection "${collection}" does not exist`);
  }

  const existing = context.recordStore.get(collection, id);
  if (!existing) {
    return notFoundResponse(`Record "${id}" not found`);
  }

  const rule = getPermissionRule(definition, "delete");
  const denied = denyUnlessAllowed(
    checkCollectionPermission(definition, "delete", context.authContext, existing),
    rule,
    context.authContext,
  );
  if (denied) {
    return denied;
  }

  try {
    const deleted = context.recordStore.delete(collection, id);
    if (!deleted) {
      return notFoundResponse(`Record "${id}" not found`);
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof CollectionNotFoundError) {
      return notFoundResponse(error.message);
    }
    throw error;
  }
}

export function handleCollectionRoute(
  context: RecordHandlerContext,
  collection: string,
  request: Request,
): Response | Promise<Response> {
  switch (request.method) {
    case "GET":
      return handleListRecords(context, collection);
    case "POST":
      return handleCreateRecord(context, collection, request);
    default:
      return methodNotAllowedResponse();
  }
}

export function handleRecordRoute(
  context: RecordHandlerContext,
  collection: string,
  id: string,
  request: Request,
): Response | Promise<Response> {
  switch (request.method) {
    case "GET":
      return handleGetRecord(context, collection, id);
    case "PUT":
      return handleUpdateRecord(context, collection, id, request);
    case "DELETE":
      return handleDeleteRecord(context, collection, id);
    default:
      return methodNotAllowedResponse();
  }
}
