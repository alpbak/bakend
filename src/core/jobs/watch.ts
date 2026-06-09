import { watch } from "node:fs";
import type { Logger } from "../logging/logger.ts";
import { JobsError } from "./types.ts";

const DEBOUNCE_MS = 100;

interface WatchableEngine {
  reload(): Promise<void>;
}

export function createJobsWatcher(
  jobsDir: string,
  engine: WatchableEngine,
  logger: Logger,
): () => void {
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let reloading = false;

  let watcher: ReturnType<typeof watch>;

  try {
    watcher = watch(jobsDir, { recursive: true }, (_eventType, filename) => {
      if (!filename || filename.startsWith(".bakend-cache")) {
        return;
      }

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        if (reloading) {
          return;
        }

        reloading = true;
        engine
          .reload()
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`Job reload failed: ${message}`);
          })
          .finally(() => {
            reloading = false;
          });
      }, DEBOUNCE_MS);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new JobsError(`Failed to watch jobs directory ${jobsDir}: ${message}`);
  }

  return () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    watcher.close();
  };
}
