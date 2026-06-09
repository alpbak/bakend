import { isAbsolute, resolve } from "node:path";
import type { BakendConfig } from "./types.ts";

function resolveProjectPath(projectDir: string, target: string): string {
  if (target === ":memory:" || isAbsolute(target)) {
    return target;
  }

  return resolve(projectDir, target);
}

export function resolveProjectPaths(config: BakendConfig, projectDir: string): BakendConfig {
  return {
    ...config,
    database: resolveProjectPath(projectDir, config.database),
    storage: resolveProjectPath(projectDir, config.storage),
    logFile: config.logFile ? resolveProjectPath(projectDir, config.logFile) : undefined,
  };
}
