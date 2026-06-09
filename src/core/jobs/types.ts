import type { Database } from "bun:sqlite";
import type { Logger } from "../logging/logger.ts";

export interface JobContext {
  db: Database;
  logger: Logger;
}

export type JobHandler = (context: JobContext) => void | Promise<void>;

export interface RegisteredJob {
  name: string;
  filePath: string;
  schedule: string;
  handler: JobHandler;
}

export type JobRunStatus = "completed" | "failed";

export interface JobRunLog {
  runId: string;
  startedAt: string;
  endedAt: string;
  status: JobRunStatus;
  error?: string;
  attempt: number;
}

export interface JobsEngine {
  load(): Promise<void>;
  reload(): Promise<void>;
  list(): RegisteredJob[];
  getRuns(name: string): JobRunLog[];
  runDueJobs(): Promise<void>;
  shutdown(): void;
}

export class JobsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobsError";
  }
}
