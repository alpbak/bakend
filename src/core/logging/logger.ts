import type { LogLevel } from "./types.ts";
import { LOG_LEVEL_PRIORITY } from "./types.ts";

export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export function createLogger(level: LogLevel): Logger {
  const minPriority = LOG_LEVEL_PRIORITY[level];

  function log(targetLevel: LogLevel, message: string): void {
    if (LOG_LEVEL_PRIORITY[targetLevel] < minPriority) {
      return;
    }

    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ${targetLevel} ${message}`);
  }

  return {
    debug: (message) => log("DEBUG", message),
    info: (message) => log("INFO", message),
    warn: (message) => log("WARN", message),
    error: (message) => log("ERROR", message),
  };
}
