import type { RegisteredTrigger, TriggerHandler, TriggerType } from "./types.ts";

interface PendingRegistration {
  collection: string;
  type: TriggerType;
  eventType: string;
  handler: TriggerHandler;
}

interface TriggerRegistryState {
  pending: PendingRegistration[];
}

const registryStack: TriggerRegistryState[] = [];

function getActiveRegistry(): TriggerRegistryState {
  const registry = registryStack[registryStack.length - 1];
  if (!registry) {
    throw new Error("Function triggers can only be registered while loading function modules");
  }

  return registry;
}

export async function withTriggerRegistry<T>(fn: () => Promise<T>): Promise<T> {
  const registry: TriggerRegistryState = { pending: [] };
  registryStack.push(registry);

  try {
    return await fn();
  } finally {
    registryStack.pop();
  }
}

export function clearTriggerRegistry(): void {
  getActiveRegistry().pending.length = 0;
}

export function registerTrigger(
  collection: string,
  type: TriggerType,
  eventType: string,
  handler: TriggerHandler,
): void {
  getActiveRegistry().pending.push({ collection, type, eventType, handler });
}

export function takePendingTriggers(filePath: string): RegisteredTrigger[] {
  const registry = getActiveRegistry();
  const registered = registry.pending.map((entry) => ({
    collection: entry.collection,
    type: entry.type,
    eventType: entry.eventType,
    filePath,
    handler: entry.handler,
  }));

  registry.pending.length = 0;
  return registered;
}
