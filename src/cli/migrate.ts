import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { CollectionDefinition } from "../core/collections/types.ts";
import { CollectionError } from "../core/collections/types.ts";
import type { ProjectContext } from "./project-context.ts";

function parseDefinitionFile(filePath: string): CollectionDefinition {
  const raw = readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as CollectionDefinition;

  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof parsed.name !== "string" ||
    !Array.isArray(parsed.fields)
  ) {
    throw new CollectionError(`Invalid collection definition in ${filePath}`);
  }

  return parsed;
}

export function readCollectionFiles(collectionsDir: string): Map<string, CollectionDefinition> {
  const result = new Map<string, CollectionDefinition>();

  if (!existsSync(collectionsDir)) {
    return result;
  }

  const entries = readdirSync(collectionsDir)
    .filter((entry) => entry.endsWith(".json"))
    .sort();

  for (const entry of entries) {
    const filePath = join(collectionsDir, entry);
    const definition = parseDefinitionFile(filePath);
    result.set(definition.name, definition);
  }

  return result;
}

function definitionsEqual(
  left: CollectionDefinition,
  right: CollectionDefinition,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export interface MigrateStatusEntry {
  name: string;
  status: "synced" | "file_only" | "db_only" | "drift";
}

export function migrateStatus(context: ProjectContext): MigrateStatusEntry[] {
  const fileDefs = readCollectionFiles(context.collectionsDir);
  const dbDefs = new Map(
    context.collections.list().map((meta) => [meta.name, meta.definition]),
  );
  const names = new Set([...fileDefs.keys(), ...dbDefs.keys()]);
  const entries: MigrateStatusEntry[] = [];

  for (const name of [...names].sort()) {
    const fileDef = fileDefs.get(name);
    const dbDef = dbDefs.get(name);

    if (fileDef && !dbDef) {
      entries.push({ name, status: "file_only" });
    } else if (!fileDef && dbDef) {
      entries.push({ name, status: "db_only" });
    } else if (fileDef && dbDef) {
      entries.push({
        name,
        status: definitionsEqual(fileDef, dbDef) ? "synced" : "drift",
      });
    }
  }

  return entries;
}

export function migrateApply(context: ProjectContext): string[] {
  const fileDefs = readCollectionFiles(context.collectionsDir);
  const applied: string[] = [];

  for (const [name, definition] of fileDefs) {
    if (!context.collections.exists(name)) {
      context.collections.create(definition);
      applied.push(`created ${name}`);
      continue;
    }

    const existing = context.collections.get(name);
    if (existing && !definitionsEqual(existing.definition, definition)) {
      context.collections.update(name, definition);
      applied.push(`updated ${name}`);
    }
  }

  return applied;
}

export function migrateExport(context: ProjectContext): string[] {
  mkdirSync(context.collectionsDir, { recursive: true });
  const exported: string[] = [];

  for (const meta of context.collections.list()) {
    const filePath = join(context.collectionsDir, `${meta.name}.json`);
    writeFileSync(filePath, `${JSON.stringify(meta.definition, null, 2)}\n`, "utf8");
    exported.push(meta.name);
  }

  return exported;
}

export function printMigrateStatus(entries: MigrateStatusEntry[]): void {
  if (entries.length === 0) {
    console.log("No collections found in files or database.");
    return;
  }

  for (const entry of entries) {
    console.log(`${entry.name}\t${entry.status}`);
  }
}
