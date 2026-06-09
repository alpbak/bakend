import type { StorageEngine } from "../../../storage/types.ts";
import { jsonOk } from "../../responses.ts";

export interface AdminStorageContext {
  storage: StorageEngine;
}

function parsePagination(url: URL): { limit: number; offset: number } {
  const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1), 100);
  const offset = Math.max(Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);
  return { limit, offset };
}

export function handleAdminListStorage(context: AdminStorageContext, request: Request): Response {
  const url = new URL(request.url);
  const { limit, offset } = parsePagination(url);
  const result = context.storage.list(limit, offset);
  return jsonOk(result);
}
