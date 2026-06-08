import type { Logger } from "../logging/logger.ts";
import type { BakendEvent, EmitOptions, EventBus, EventHandler } from "./types.ts";

function createEventId(): string {
  return `evt_${crypto.randomUUID()}`;
}

function isPromise(value: unknown): value is Promise<unknown> {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as Promise<unknown>).then === "function"
  );
}

function invokeHandler(handler: EventHandler, event: BakendEvent, logger: Logger): Promise<void> | void {
  try {
    const result = handler(event);

    if (!isPromise(result)) {
      return;
    }

    return result.catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Event handler failed for ${event.type}: ${message}`);
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Event handler failed for ${event.type}: ${message}`);
  }
}

export function createEventBus(logger: Logger): EventBus {
  const handlers = new Map<string, EventHandler[]>();
  const pending = new Set<Promise<void>>();

  function track(promise: Promise<void>): void {
    pending.add(promise);
    promise.finally(() => {
      pending.delete(promise);
    });
  }

  return {
    on(type, handler) {
      const typeHandlers = handlers.get(type) ?? [];
      typeHandlers.push(handler);
      handlers.set(type, typeHandlers);

      return () => {
        const currentHandlers = handlers.get(type);
        if (!currentHandlers) {
          return;
        }

        const index = currentHandlers.indexOf(handler);
        if (index === -1) {
          return;
        }

        currentHandlers.splice(index, 1);

        if (currentHandlers.length === 0) {
          handlers.delete(type);
        }
      };
    },

    emit(type, options: EmitOptions = {}) {
      const event: BakendEvent = {
        id: createEventId(),
        type,
        timestamp: new Date().toISOString(),
        source: options.source ?? "system",
        payload: options.payload,
      };

      logger.debug(`Event emitted: ${event.type} (${event.id})`);

      const typeHandlers = handlers.get(type) ?? [];
      for (const handler of typeHandlers) {
        const result = invokeHandler(handler, event, logger);
        if (result) {
          track(result);
        }
      }
    },

    async flush() {
      await Promise.all([...pending]);
    },
  };
}
