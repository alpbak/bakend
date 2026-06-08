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
  jsonOk,
  methodNotAllowedResponse,
  notFoundResponse,
  parseJsonBody,
  validationErrorResponse,
} from "../responses.ts";
import type { ListRecordsResponse } from "../types.ts";

interface RecordHandlerContext {
  collections: CollectionsEngine;
  recordStore: RecordStore;
  logger: Logger;
}

function ensureCollectionExists(collections: CollectionsEngine, name: string): boolean {
  return collections.exists(name);
}

export function handleListRecords(
  context: RecordHandlerContext,
  collection: string,
): Response {
  if (!ensureCollectionExists(context.collections, collection)) {
    return notFoundResponse(`Collection "${collection}" does not exist`);
  }

  const items = context.recordStore.list(collection);
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

  let data: Record<string, unknown>;
  try {
    data = await parseJsonBody(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body";
    return badRequestResponse(message);
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

  try {
    const record = context.recordStore.get(collection, id);
    if (!record) {
      return notFoundResponse(`Record "${id}" not found`);
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
