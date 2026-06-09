import type { AuthContext } from "../auth/types.ts";
import { checkCollectionPermission } from "../auth/permissions.ts";
import type { CollectionsEngine } from "../collections/types.ts";
import type { BakendEvent } from "../events/types.ts";
import { COLLECTION_EVENT_SUFFIXES } from "./types.ts";

function parseCollectionEventType(eventType: string): { collection: string; operation: string } | null {
  const lastDot = eventType.lastIndexOf(".");
  if (lastDot === -1) {
    return null;
  }

  const collection = eventType.slice(0, lastDot);
  const operation = eventType.slice(lastDot + 1);

  if (!collection || !(COLLECTION_EVENT_SUFFIXES as readonly string[]).includes(operation)) {
    return null;
  }

  return { collection, operation };
}

function recordFromPayload(payload: unknown): Record<string, unknown> | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }

  return payload as Record<string, unknown>;
}

export function isCollectionEvent(eventType: string): boolean {
  return parseCollectionEventType(eventType) !== null;
}

export function canReceiveCollectionEvent(
  collections: CollectionsEngine,
  authContext: AuthContext | null,
  event: BakendEvent,
): boolean {
  const parsed = parseCollectionEventType(event.type);
  if (!parsed) {
    return true;
  }

  if (!collections.exists(parsed.collection)) {
    return false;
  }

  const meta = collections.get(parsed.collection);
  if (!meta) {
    return false;
  }

  const record = recordFromPayload(event.payload);
  if (parsed.operation === "deleted") {
    return checkCollectionPermission(meta.definition, "read", authContext, record);
  }

  if (!record) {
    return false;
  }

  return checkCollectionPermission(meta.definition, "read", authContext, record);
}
