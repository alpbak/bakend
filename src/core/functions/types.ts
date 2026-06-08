import type { Database } from "bun:sqlite";
import type { BakendEvent } from "../events/types.ts";
import type { Logger } from "../logging/logger.ts";

export type TriggerType = "create" | "update" | "delete" | "login" | "register";

export interface FunctionContext {
  event: BakendEvent;
  record: Record<string, unknown>;
  db: Database;
  logger: Logger;
}

export type TriggerHandler = (context: FunctionContext) => void | Promise<void>;

export interface RegisteredTrigger {
  collection: string;
  type: TriggerType;
  eventType: string;
  filePath: string;
  handler: TriggerHandler;
}

export interface FunctionsEngine {
  load(): Promise<void>;
  reload(): Promise<void>;
  list(): RegisteredTrigger[];
  shutdown(): void;
}

export class FunctionsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FunctionsError";
  }
}
