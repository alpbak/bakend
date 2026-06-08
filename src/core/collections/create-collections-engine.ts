import type { Database } from "bun:sqlite";
import type { Logger } from "../logging/logger.ts";
import type { EventBus } from "../events/types.ts";
import { generateTableDDL } from "./generate-schema.ts";
import { validateDefinition } from "./validate-definition.ts";
import { validateRecord } from "./validate-record.ts";
import {
  CollectionError,
  type CollectionDefinition,
  type CollectionMeta,
  type CollectionsEngine,
  type RecordValidationMode,
  type ValidationResult,
} from "./types.ts";

interface CreateCollectionsEngineOptions {
  db: Database;
  logger: Logger;
  eventBus: EventBus;
}

interface CollectionRow {
  name: string;
  definition: string;
  created_at: string;
  updated_at: string;
}

function parseDefinition(definitionJson: string): CollectionDefinition {
  const parsed = JSON.parse(definitionJson) as CollectionDefinition;
  return parsed;
}

function rowToMeta(row: CollectionRow): CollectionMeta {
  return {
    name: row.name,
    definition: parseDefinition(row.definition),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function tableExists(db: Database, tableName: string): boolean {
  const row = db
    .query<{ name: string }, [string]>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    )
    .get(tableName);

  return row !== null;
}

function ensureTablesExist(db: Database, definitions: CollectionMeta[], logger: Logger): void {
  for (const meta of definitions) {
    if (!tableExists(db, meta.name)) {
      logger.debug(`Recreating missing table for collection "${meta.name}"`);
      for (const statement of generateTableDDL(meta.definition)) {
        db.run(statement);
      }
    }
  }
}

export function createCollectionsEngine(options: CreateCollectionsEngineOptions): CollectionsEngine {
  const { db, logger, eventBus } = options;

  function listRows(): CollectionRow[] {
    return db
      .query<CollectionRow, []>(
        "SELECT name, definition, created_at, updated_at FROM _collections ORDER BY name",
      )
      .all();
  }

  function loadExisting(): CollectionMeta[] {
    const rows = listRows();
    const metas = rows.map(rowToMeta);
    ensureTablesExist(db, metas, logger);
    return metas;
  }

  loadExisting();

  return {
    create(definition: CollectionDefinition): CollectionMeta {
      const existingCollections = listRows().map((row) => row.name);
      const validation = validateDefinition(definition, { existingCollections });

      if (!validation.valid) {
        const message = validation.errors.map((error) => error.message).join("; ");
        throw new CollectionError(message);
      }

      const now = new Date().toISOString();
      const definitionJson = JSON.stringify(definition);

      db.run(
        "INSERT INTO _collections (name, definition, created_at, updated_at) VALUES (?, ?, ?, ?)",
        [definition.name, definitionJson, now, now],
      );

      for (const statement of generateTableDDL(definition)) {
        db.run(statement);
      }

      eventBus.emit("system.collection.created", {
        source: "collections",
        payload: { name: definition.name },
      });

      logger.info(`Collection created: ${definition.name}`);

      return {
        name: definition.name,
        definition,
        createdAt: now,
        updatedAt: now,
      };
    },

    get(name: string): CollectionMeta | null {
      const row = db
        .query<CollectionRow, [string]>(
          "SELECT name, definition, created_at, updated_at FROM _collections WHERE name = ?",
        )
        .get(name);

      return row ? rowToMeta(row) : null;
    },

    list(): CollectionMeta[] {
      return listRows().map(rowToMeta);
    },

    exists(name: string): boolean {
      const row = db
        .query<{ name: string }, [string]>("SELECT name FROM _collections WHERE name = ?")
        .get(name);

      return row !== null;
    },

    validateRecord(
      collection: string,
      data: Record<string, unknown>,
      mode: RecordValidationMode,
    ): ValidationResult {
      const meta = this.get(collection);
      if (!meta) {
        return {
          valid: false,
          errors: [
            {
              field: collection,
              rule: "exists",
              message: `Collection "${collection}" does not exist`,
            },
          ],
        };
      }

      return validateRecord(db, meta.definition, data, mode);
    },
  };
}
