import type { LogLevel } from "./types.ts";
import { LOG_LEVEL_PRIORITY } from "./types.ts";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  getRecentLogs(limit?: number, level?: LogLevel): LogEntry[];
}

const DEFAULT_LOG_BUFFER_SIZE = 500;

export function createLogger(level: LogLevel, bufferSize = DEFAULT_LOG_BUFFER_SIZE): Logger {
  const minPriority = LOG_LEVEL_PRIORITY[level];
  const buffer: LogEntry[] = [];

  function appendEntry(targetLevel: LogLevel, message: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: targetLevel,
      message,
    };

    buffer.push(entry);
    if (buffer.length > bufferSize) {
      buffer.shift();
    }
  }

  function log(targetLevel: LogLevel, message: string): void {
    if (LOG_LEVEL_PRIORITY[targetLevel] < minPriority) {
      return;
    }

    appendEntry(targetLevel, message);
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ${targetLevel} ${message}`);
  }

  return {
    debug: (message) => log("DEBUG", message),
    info: (message) => log("INFO", message),
    warn: (message) => log("WARN", message),
    error: (message) => log("ERROR", message),
    getRecentLogs(limit = 100, filterLevel?: LogLevel) {
      let entries = buffer;

      if (filterLevel) {
        const minFilter = LOG_LEVEL_PRIORITY[filterLevel];
        entries = entries.filter((entry) => LOG_LEVEL_PRIORITY[entry.level] >= minFilter);
      }

      if (limit <= 0) {
        return [];
      }

      return entries.slice(-limit);
    },
  };
}
