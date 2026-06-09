import type { AuthContext } from "../../auth/types.ts";
import { canDeleteFile, canReadFile } from "../../storage/permissions.ts";
import { StorageError } from "../../storage/types.ts";
import type { StorageEngine } from "../../storage/types.ts";
import type { Logger } from "../../logging/logger.ts";
import {
  badRequestResponse,
  forbiddenResponse,
  jsonOk,
  methodNotAllowedResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../responses.ts";

export interface StorageHandlerContext {
  storage: StorageEngine;
  authContext: AuthContext | null;
  logger: Logger;
}

function handleStorageError(error: unknown): Response {
  if (error instanceof StorageError) {
    if (error.status === 400) {
      return badRequestResponse(error.message);
    }
    if (error.status === 404) {
      return notFoundResponse(error.message);
    }
  }
  throw error;
}

function parseVisibility(value: unknown): "public" | "protected" {
  if (typeof value === "string" && value === "public") {
    return "public";
  }
  return "protected";
}

export async function handleStorageUpload(
  context: StorageHandlerContext,
  request: Request,
): Promise<Response> {
  if (request.method !== "POST") {
    return methodNotAllowedResponse();
  }

  if (!context.authContext) {
    return unauthorizedResponse();
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return badRequestResponse("Invalid multipart form data");
  }

  const fileEntry = formData.get("file");
  if (!fileEntry || !(fileEntry instanceof File)) {
    return badRequestResponse("Field 'file' is required");
  }

  const visibility = parseVisibility(formData.get("visibility"));

  try {
    const data = new Uint8Array(await fileEntry.arrayBuffer());
    const metadata = await context.storage.upload(
      data,
      fileEntry.name || "unnamed",
      fileEntry.type || "application/octet-stream",
      visibility,
      context.authContext.user.id,
    );

    return jsonOk(metadata, 201);
  } catch (error) {
    return handleStorageError(error);
  }
}

export async function handleStorageFileRoute(
  context: StorageHandlerContext,
  fileId: string,
  request: Request,
): Promise<Response> {
  const metadata = context.storage.getMetadata(fileId);
  if (!metadata) {
    return notFoundResponse("File not found");
  }

  if (request.method === "GET") {
    if (!canReadFile(metadata, context.authContext)) {
      if (!context.authContext) {
        return unauthorizedResponse();
      }
      return forbiddenResponse();
    }

    const data = context.storage.read(fileId);
    if (!data) {
      return notFoundResponse("File not found");
    }

    const disposition = `inline; filename="${metadata.filename.replace(/"/g, '\\"')}"`;

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": metadata.mimeType,
        "Content-Disposition": disposition,
        "Content-Length": String(metadata.size),
      },
    });
  }

  if (request.method === "DELETE") {
    if (!context.authContext) {
      return unauthorizedResponse();
    }

    if (!canDeleteFile(metadata, context.authContext)) {
      return forbiddenResponse();
    }

    const deleted = await context.storage.delete(fileId);
    if (!deleted) {
      return notFoundResponse("File not found");
    }

    return new Response(null, { status: 204 });
  }

  return methodNotAllowedResponse();
}
