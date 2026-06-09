import type { Database } from "bun:sqlite";
import type { AuthUser } from "../auth/types.ts";
import type { BakendEvent } from "../events/types.ts";
import type { Logger } from "../logging/logger.ts";
import type { StorageContext } from "../storage/types.ts";
import type { FunctionContext } from "./types.ts";

function payloadToRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }

  return {};
}

function authUserFromPayload(event: BakendEvent): AuthUser | null {
  if (!event.type.startsWith("auth.")) {
    return null;
  }

  const payload = event.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.id !== "string" || typeof record.email !== "string") {
    if (event.type === "auth.logout" && typeof record.userId === "string") {
      return {
        id: record.userId,
        email: "",
        role: "authenticated",
        createdAt: "",
      };
    }
    return null;
  }

  return {
    id: record.id,
    email: record.email,
    role: typeof record.role === "string" ? (record.role as AuthUser["role"]) : "authenticated",
    createdAt: typeof record.createdAt === "string" ? record.createdAt : "",
  };
}

export function createFunctionContext(
  event: BakendEvent,
  db: Database,
  logger: Logger,
  storage: StorageContext,
): FunctionContext {
  return {
    event,
    record: payloadToRecord(event.payload),
    db,
    logger,
    auth: { user: authUserFromPayload(event) },
    storage,
  };
}
