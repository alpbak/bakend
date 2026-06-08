import type { Database } from "bun:sqlite";
import type { BakendEvent } from "../events/types.ts";
import type { Logger } from "../logging/logger.ts";
import type { FunctionContext } from "./types.ts";

function payloadToRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }

  return {};
}

export function createFunctionContext(
  event: BakendEvent,
  db: Database,
  logger: Logger,
): FunctionContext {
  return {
    event,
    record: payloadToRecord(event.payload),
    db,
    logger,
  };
}
