import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Logger } from "../logging/logger.ts";
import type { CollectionDefinition, CollectionsEngine } from "./types.ts";
import { CollectionError } from "./types.ts";

function parseDefinitionFile(filePath: string): CollectionDefinition {
  let raw: string;

  try {
    raw = readFileSync(filePath, "utf8");
  } catch (error) {
    throw new CollectionError(
      `Failed to read collection definition ${filePath}: ${String(error)}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new CollectionError(
      `Invalid JSON in collection definition ${filePath}: ${String(error)}`,
    );
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as CollectionDefinition).name !== "string" ||
    !Array.isArray((parsed as CollectionDefinition).fields)
  ) {
    throw new CollectionError(
      `Invalid collection definition in ${filePath}: expected { name, fields }`,
    );
  }

  return parsed as CollectionDefinition;
}

function definitionsEqual(
  left: CollectionDefinition,
  right: CollectionDefinition,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function loadCollectionDefinitions(
  engine: CollectionsEngine,
  collectionsDir: string,
  logger: Logger,
): void {
  let entries: string[];

  try {
    entries = readdirSync(collectionsDir)
      .filter((entry) => entry.endsWith(".json"))
      .sort();
  } catch (error) {
    const message = String(error);
    if (message.includes("ENOENT")) {
      logger.debug(`No collections directory at ${collectionsDir}`);
      return;
    }

    throw new CollectionError(
      `Failed to read collections directory ${collectionsDir}: ${message}`,
    );
  }

  for (const entry of entries) {
    const filePath = join(collectionsDir, entry);
    const definition = parseDefinitionFile(filePath);

    if (engine.exists(definition.name)) {
      const existing = engine.get(definition.name);
      if (existing && !definitionsEqual(existing.definition, definition)) {
        throw new CollectionError(
          `Collection "${definition.name}" already exists with a different definition (${filePath})`,
        );
      }

      logger.debug(`Skipping existing collection "${definition.name}" from ${filePath}`);
      continue;
    }

    engine.create(definition);
    logger.debug(`Loaded collection "${definition.name}" from ${filePath}`);
  }
}
