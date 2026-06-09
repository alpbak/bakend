import type { Logger } from "../../../logging/logger.ts";
import { LOG_LEVELS, type LogLevel } from "../../../logging/types.ts";
import { badRequestResponse, jsonOk } from "../../responses.ts";

export interface AdminLogsContext {
  logger: Logger;
}

function parseLimit(url: URL): number {
  return Math.min(Math.max(Number.parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 1), 500);
}

function parseLevel(url: URL): LogLevel | undefined {
  const level = url.searchParams.get("level");
  if (!level) {
    return undefined;
  }

  if (!LOG_LEVELS.includes(level as LogLevel)) {
    return undefined;
  }

  return level as LogLevel;
}

export function handleAdminListLogs(context: AdminLogsContext, request: Request): Response {
  const url = new URL(request.url);
  const limit = parseLimit(url);
  const level = parseLevel(url);

  if (url.searchParams.has("level") && !level) {
    return badRequestResponse(`level must be one of: ${LOG_LEVELS.join(", ")}`);
  }

  const items = context.logger.getRecentLogs(limit, level);
  return jsonOk({ items });
}
