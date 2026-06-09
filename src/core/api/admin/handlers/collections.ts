import { CollectionError } from "../../../collections/types.ts";
import type { CollectionDefinition } from "../../../collections/types.ts";
import type { CollectionsEngine } from "../../../collections/types.ts";
import {
  badRequestResponse,
  jsonOk,
  methodNotAllowedResponse,
  notFoundResponse,
  parseJsonBody,
} from "../../responses.ts";

export interface AdminCollectionsContext {
  collections: CollectionsEngine;
}

function parseCollectionDefinition(body: Record<string, unknown>): CollectionDefinition | null {
  if (typeof body.name !== "string" || !Array.isArray(body.fields)) {
    return null;
  }

  return body as unknown as CollectionDefinition;
}

function handleCollectionError(error: unknown): Response {
  if (error instanceof CollectionError) {
    return badRequestResponse(error.message);
  }
  throw error;
}

export function handleAdminListCollections(context: AdminCollectionsContext): Response {
  return jsonOk({ items: context.collections.list() });
}

export async function handleAdminCreateCollection(
  context: AdminCollectionsContext,
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

  const definition = parseCollectionDefinition(body);
  if (!definition) {
    return badRequestResponse("Request body must include name and fields");
  }

  try {
    const meta = context.collections.create(definition);
    return jsonOk(meta, 201);
  } catch (error) {
    return handleCollectionError(error);
  }
}

export function handleAdminGetCollection(
  context: AdminCollectionsContext,
  name: string,
): Response {
  const meta = context.collections.get(name);
  if (!meta) {
    return notFoundResponse(`Collection "${name}" does not exist`);
  }

  return jsonOk(meta);
}

export async function handleAdminUpdateCollection(
  context: AdminCollectionsContext,
  name: string,
  request: Request,
): Promise<Response> {
  if (request.method !== "PUT") {
    return methodNotAllowedResponse();
  }

  let body: Record<string, unknown>;
  try {
    body = await parseJsonBody(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body";
    return badRequestResponse(message);
  }

  const definition = parseCollectionDefinition(body);
  if (!definition) {
    return badRequestResponse("Request body must include name and fields");
  }

  try {
    const meta = context.collections.update(name, definition);
    return jsonOk(meta);
  } catch (error) {
    return handleCollectionError(error);
  }
}

export function handleAdminDeleteCollection(
  context: AdminCollectionsContext,
  name: string,
  request: Request,
): Response {
  if (request.method !== "DELETE") {
    return methodNotAllowedResponse();
  }

  try {
    context.collections.delete(name);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleCollectionError(error);
  }
}
