import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { clearTriggerRegistry, takePendingTriggers, withTriggerRegistry } from "./trigger-registry.ts";
import type { RegisteredTrigger } from "./types.ts";
import { FunctionsError } from "./types.ts";

const TRIGGERS_MODULE = fileURLToPath(new URL("./triggers.ts", import.meta.url));
const BAKEND_FUNCTIONS_IMPORT = /from\s+["']bakend\/functions["']/g;

function listTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (error) {
    const message = String(error);
    if (message.includes("ENOENT")) {
      return files;
    }

    throw new FunctionsError(`Failed to read functions directory ${dir}: ${message}`);
  }

  for (const entry of entries) {
    if (entry === ".bakend-cache") {
      continue;
    }

    const filePath = join(dir, entry);
    const stats = statSync(filePath);

    if (stats.isDirectory()) {
      files.push(...listTypeScriptFiles(filePath));
      continue;
    }

    if (stats.isFile() && entry.endsWith(".ts")) {
      files.push(filePath);
    }
  }

  return files.sort();
}

function prepareImportPath(
  filePath: string,
  functionsDir: string,
  reloadToken: string,
): string {
  const source = readFileSync(filePath, "utf8");

  if (!source.includes("bakend/functions")) {
    return `${filePath}?reload=${reloadToken}`;
  }

  const transformed = source.replace(
    BAKEND_FUNCTIONS_IMPORT,
    `from "${TRIGGERS_MODULE}"`,
  );

  const cacheDir = join(functionsDir, ".bakend-cache", reloadToken);
  const cachedPath = join(cacheDir, relative(functionsDir, filePath));

  mkdirSync(dirname(cachedPath), { recursive: true });
  writeFileSync(cachedPath, transformed);

  return `${cachedPath}?reload=${reloadToken}`;
}

export async function discoverFunctions(
  functionsDir: string,
  reloadToken: string,
): Promise<RegisteredTrigger[]> {
  return withTriggerRegistry(async () => {
    const files = listTypeScriptFiles(functionsDir);
    const triggers: RegisteredTrigger[] = [];

    for (const filePath of files) {
      clearTriggerRegistry();

      const importPath = prepareImportPath(filePath, functionsDir, reloadToken);

      try {
        await import(importPath);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new FunctionsError(`Failed to load function ${filePath}: ${message}`);
      }

      triggers.push(...takePendingTriggers(filePath));
    }

    return triggers;
  });
}
