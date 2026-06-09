import type { Database } from "bun:sqlite";
import { quoteIdentifier, toColumnName } from "../core/collections/naming.ts";
import type { ProjectContext } from "./project-context.ts";

function collectReferencedFileIds(db: Database, context: ProjectContext): Set<string> {
  const referenced = new Set<string>();

  for (const meta of context.collections.list()) {
    const fileFields = meta.definition.fields.filter((field) => field.type === "file");
    if (fileFields.length === 0) {
      continue;
    }

    const rows = db
      .query<Record<string, unknown>, []>(`SELECT * FROM ${quoteIdentifier(meta.name)}`)
      .all();
    for (const row of rows) {
      for (const field of fileFields) {
        const value = row[toColumnName(field.name)];
        if (typeof value === "string" && value.length > 0) {
          referenced.add(value);
        }
      }
    }
  }

  return referenced;
}

export async function storagePrune(context: ProjectContext): Promise<string[]> {
  const referenced = collectReferencedFileIds(context.db, context);
  const removed: string[] = [];
  const batchSize = 100;
  let offset = 0;

  while (true) {
    const page = context.storage.list(batchSize, offset);
    if (page.items.length === 0) {
      break;
    }

    for (const file of page.items) {
      if (!referenced.has(file.id)) {
        await context.storage.delete(file.id);
        removed.push(file.id);
      }
    }

    offset += page.items.length;
    if (offset >= page.total) {
      break;
    }
  }

  return removed;
}

export function printStoragePruneResult(removed: string[]): void {
  if (removed.length === 0) {
    console.log("No orphan files found.");
    return;
  }

  console.log(`Removed ${removed.length} orphan file(s):`);
  for (const id of removed) {
    console.log(id);
  }
}
