import type { Database } from "bun:sqlite";
import type { BakendEvent, EventBus, UnsubscribeFn } from "../events/types.ts";
import type { Logger } from "../logging/logger.ts";
import type { StorageEngine } from "../storage/types.ts";
import { createFunctionContext } from "./context.ts";
import { discoverFunctions } from "./discover.ts";
import type { FunctionsEngine, RegisteredTrigger } from "./types.ts";
import { createFunctionsWatcher } from "./watch.ts";

export interface CreateFunctionsEngineOptions {
  eventBus: EventBus;
  db: Database;
  logger: Logger;
  functionsDir: string;
  watch?: boolean;
  storage: StorageEngine;
}

function isPromise(value: unknown): value is Promise<unknown> {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as Promise<unknown>).then === "function"
  );
}

export function createFunctionsEngine(options: CreateFunctionsEngineOptions): FunctionsEngine {
  const { eventBus, db, logger, functionsDir, watch = false, storage } = options;
  const storageContext = storage.getContext();

  let triggers: RegisteredTrigger[] = [];
  const subscriptions: UnsubscribeFn[] = [];
  let stopWatcher: (() => void) | undefined;

  function emitLifecycle(
    type: "function.started" | "function.completed" | "function.failed",
    trigger: RegisteredTrigger,
    event: BakendEvent,
    error?: unknown,
  ): void {
    eventBus.emit(type, {
      source: "functions",
      payload: {
        collection: trigger.collection,
        trigger: trigger.type,
        eventType: trigger.eventType,
        filePath: trigger.filePath,
        eventId: event.id,
        error: error instanceof Error ? error.message : error ? String(error) : undefined,
      },
    });
  }

  async function executeTrigger(trigger: RegisteredTrigger, event: BakendEvent): Promise<void> {
    emitLifecycle("function.started", trigger, event);

    try {
      const context = createFunctionContext(event, db, logger, storageContext);
      const result = trigger.handler(context);

      if (isPromise(result)) {
        await result;
      }

      emitLifecycle("function.completed", trigger, event);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(
        `Function failed (${trigger.filePath}, ${trigger.eventType}): ${message}`,
      );
      emitLifecycle("function.failed", trigger, event, error);
    }
  }

  function subscribeTrigger(trigger: RegisteredTrigger): void {
    const unsubscribe = eventBus.on(trigger.eventType, (event) => {
      const result = executeTrigger(trigger, event);
      if (isPromise(result)) {
        result.catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          logger.error(
            `Function failed (${trigger.filePath}, ${trigger.eventType}): ${message}`,
          );
        });
      }
    });

    subscriptions.push(unsubscribe);
  }

  function clearSubscriptions(): void {
    for (const unsubscribe of subscriptions) {
      unsubscribe();
    }

    subscriptions.length = 0;
  }

  async function load(): Promise<void> {
    clearSubscriptions();

    const reloadToken = `${Date.now()}_${crypto.randomUUID()}`;
    triggers = await discoverFunctions(functionsDir, reloadToken);

    for (const trigger of triggers) {
      subscribeTrigger(trigger);
    }

    if (triggers.length > 0) {
      logger.info(`Functions: ${triggers.length} trigger(s) loaded from ${functionsDir}`);
    } else {
      logger.debug(`No function triggers found in ${functionsDir}`);
    }
  }

  const engine: FunctionsEngine = {
    async load() {
      await load();
    },

    async reload() {
      logger.debug(`Reloading functions from ${functionsDir}`);
      await load();
    },

    list() {
      return [...triggers];
    },

    shutdown() {
      stopWatcher?.();
      stopWatcher = undefined;
      clearSubscriptions();
      triggers = [];
    },
  };

  if (watch) {
    stopWatcher = createFunctionsWatcher(functionsDir, engine, logger);
  }

  return engine;
}
