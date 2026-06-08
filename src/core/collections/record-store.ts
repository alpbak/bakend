import type { Database, SQLQueryBindings } from "bun:sqlite";
import type { Logger } from "../logging/logger.ts";
import type { EventBus } from "../events/types.ts";
import { quoteIdentifier } from "./naming.ts";
import { generateRecordId } from "./record-id.ts";
import { recordToColumns, rowToRecord } from "./serialize-record.ts";
import type { CollectionsEngine, ValidationError, ValidationResult } from "./types.ts";

export class RecordValidationError extends Error {
  readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super(errors.map((error) => error.message).join("; "));
    this.name = "RecordValidationError";
    this.errors = errors;
  }
}

export class RecordNotFoundError extends Error {
  constructor(collection: string, id: string) {
    super(`Record "${id}" not found in collection "${collection}"`);
    this.name = "RecordNotFoundError";
  }
}

export class CollectionNotFoundError extends Error {
  constructor(collection: string) {
    super(`Collection "${collection}" does not exist`);
    this.name = "CollectionNotFoundError";
  }
}

export interface RecordStore {
  create(collection: string, data: Record<string, unknown>): Record<string, unknown>;
  get(collection: string, id: string): Record<string, unknown> | null;
  list(collection: string): Record<string, unknown>[];
  update(collection: string, id: string, data: Record<string, unknown>): Record<string, unknown>;
  delete(collection: string, id: string): boolean;
}

interface CreateRecordStoreOptions {
  db: Database;
  collections: CollectionsEngine;
  logger: Logger;
  eventBus: EventBus;
}

function assertValid(validation: ValidationResult): void {
  if (!validation.valid) {
    throw new RecordValidationError(validation.errors);
  }
}

function getDefinition(collections: CollectionsEngine, collection: string) {
  const meta = collections.get(collection);
  if (!meta) {
    throw new CollectionNotFoundError(collection);
  }
  return meta.definition;
}

export function createRecordStore(options: CreateRecordStoreOptions): RecordStore {
  const { db, collections, logger, eventBus } = options;

  function getRow(collection: string, id: string): Record<string, unknown> | null {
    const table = quoteIdentifier(collection);
    const row = db
      .query<Record<string, unknown>, [string]>(`SELECT * FROM ${table} WHERE ${quoteIdentifier("id")} = ?`)
      .get(id);

    return row ?? null;
  }

  return {
    create(collection, data) {
      const definition = getDefinition(collections, collection);
      const id = generateRecordId();
      const now = new Date().toISOString();
      const recordData = { ...data, id, createdAt: now, updatedAt: now };

      assertValid(collections.validateRecord(collection, recordData, "create"));

      const columns = recordToColumns(definition, recordData);
      columns.id = id;
      columns.created_at = now;
      columns.updated_at = now;

      const columnNames = Object.keys(columns);
      const placeholders = columnNames.map(() => "?").join(", ");
      const sql = `INSERT INTO ${quoteIdentifier(collection)} (${columnNames.map(quoteIdentifier).join(", ")}) VALUES (${placeholders})`;

      db.run(sql, columnNames.map((column) => columns[column] as SQLQueryBindings));

      const row = getRow(collection, id);
      if (!row) {
        throw new Error(`Failed to read created record "${id}"`);
      }

      const record = rowToRecord(definition, row);
      eventBus.emit(`${collection}.created`, { source: "collections", payload: record });
      logger.debug(`Record created: ${collection}/${id}`);

      return record;
    },

    get(collection, id) {
      const definition = getDefinition(collections, collection);
      const row = getRow(collection, id);
      return row ? rowToRecord(definition, row) : null;
    },

    list(collection) {
      const definition = getDefinition(collections, collection);
      const table = quoteIdentifier(collection);
      const rows = db
        .query<Record<string, unknown>, []>(
          `SELECT * FROM ${table} ORDER BY ${quoteIdentifier("created_at")} DESC, ${quoteIdentifier("id")} DESC`,
        )
        .all();

      return rows.map((row) => rowToRecord(definition, row));
    },

    update(collection, id, data) {
      const definition = getDefinition(collections, collection);
      const existing = getRow(collection, id);

      if (!existing) {
        throw new RecordNotFoundError(collection, id);
      }

      const existingRecord = rowToRecord(definition, existing);
      const now = new Date().toISOString();
      const updateData = { ...data, id, updatedAt: now };

      assertValid(collections.validateRecord(collection, updateData, "update"));

      const columns = recordToColumns(definition, updateData);
      columns.updated_at = now;

      if (Object.keys(columns).length === 1) {
        return existingRecord;
      }

      const columnNames = Object.keys(columns);
      const assignments = columnNames
        .map((column) => `${quoteIdentifier(column)} = ?`)
        .join(", ");
      const sql = `UPDATE ${quoteIdentifier(collection)} SET ${assignments} WHERE ${quoteIdentifier("id")} = ?`;

      db.run(sql, [...columnNames.map((column) => columns[column] as SQLQueryBindings), id]);

      const row = getRow(collection, id);
      if (!row) {
        throw new RecordNotFoundError(collection, id);
      }

      const record = rowToRecord(definition, row);
      eventBus.emit(`${collection}.updated`, { source: "collections", payload: record });
      logger.debug(`Record updated: ${collection}/${id}`);

      return record;
    },

    delete(collection, id) {
      getDefinition(collections, collection);

      const existing = getRow(collection, id);
      if (!existing) {
        return false;
      }

      db.run(`DELETE FROM ${quoteIdentifier(collection)} WHERE ${quoteIdentifier("id")} = ?`, [id]);

      eventBus.emit(`${collection}.deleted`, { source: "collections", payload: { id } });
      logger.debug(`Record deleted: ${collection}/${id}`);

      return true;
    },
  };
}
