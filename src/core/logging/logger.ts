import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from "node:fs";
import { dirname } from "node:path";
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
  close?(): void;
}

const DEFAULT_LOG_BUFFER_SIZE = 500;
const DEFAULT_MAX_LOG_FILE_BYTES = 5 * 1024 * 1024;

function formatLine(entry: LogEntry): string {
  return `[${entry.timestamp}] ${entry.level} ${entry.message}\n`;
}

function rotateLogFileIfNeeded(logFile: string, maxBytes: number): void {
  if (!existsSync(logFile)) {
    return;
  }

  const size = statSync(logFile).size;
  if (size < maxBytes) {
    return;
  }

  const rotated = `${logFile}.1`;
  if (existsSync(rotated)) {
    renameSync(rotated, `${logFile}.2`);
  }
  renameSync(logFile, rotated);
}

export function createLogger(
  level: LogLevel,
  bufferSize = DEFAULT_LOG_BUFFER_SIZE,
  logFile?: string,
  maxLogFileBytes = DEFAULT_MAX_LOG_FILE_BYTES,
): Logger {
  const minPriority = LOG_LEVEL_PRIORITY[level];
  const buffer: LogEntry[] = [];

  if (logFile) {
    const directory = dirname(logFile);
    if (directory && directory !== ".") {
      mkdirSync(directory, { recursive: true });
    }
  }

  function writeToFile(entry: LogEntry): void {
    if (!logFile) {
      return;
    }

    try {
      rotateLogFileIfNeeded(logFile, maxLogFileBytes);
      appendFileSync(logFile, formatLine(entry), "utf8");
    } catch {
      // File logging must not crash the server.
    }
  }

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

    writeToFile(entry);
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
    close() {
      // append-only file sink; nothing to flush
    },
  };
}
