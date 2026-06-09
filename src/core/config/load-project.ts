import { dirname, resolve } from "node:path";
import { DEFAULT_CONFIG_PATH } from "./defaults.ts";
import { loadConfig } from "./load.ts";
import { resolveProjectPaths } from "./resolve-paths.ts";
import type { BakendConfig, LoadConfigOptions } from "./types.ts";

export interface ProjectConfig {
  configPath: string;
  projectDir: string;
  config: BakendConfig;
}

export function loadProjectConfig(options: LoadConfigOptions = {}): ProjectConfig {
  const configPath = resolve(options.configPath ?? DEFAULT_CONFIG_PATH);
  const projectDir = dirname(configPath);
  const config = resolveProjectPaths(loadConfig({ configPath }), projectDir);

  return { configPath, projectDir, config };
}
