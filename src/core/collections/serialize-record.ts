import { toColumnName } from "./naming.ts";
import type { CollectionDefinition, FieldDefinition } from "./types.ts";

const COLUMN_TO_FIELD: Record<string, string> = {
  id: "id",
  created_at: "createdAt",
  updated_at: "updatedAt",
};

function fieldByName(definition: CollectionDefinition, name: string): FieldDefinition | undefined {
  return definition.fields.find((field) => field.name === name);
}

function deserializeFieldValue(field: FieldDefinition, value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  switch (field.type) {
    case "boolean":
      return value === 1 || value === true;
    case "json":
      return typeof value === "string" ? JSON.parse(value) : value;
    default:
      return value;
  }
}

function serializeFieldValue(field: FieldDefinition, value: unknown): unknown {
  if (value === undefined || value === null) {
    return null;
  }

  switch (field.type) {
    case "boolean":
      return value === true ? 1 : 0;
    case "json":
      return JSON.stringify(value);
    default:
      return value;
  }
}

export function rowToRecord(
  definition: CollectionDefinition,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const record: Record<string, unknown> = {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  for (const field of definition.fields) {
    const column = toColumnName(field.name);
    if (Object.hasOwn(row, column)) {
      record[field.name] = deserializeFieldValue(field, row[column]);
    }
  }

  return record;
}

export function recordToColumns(
  definition: CollectionDefinition,
  data: Record<string, unknown>,
  fields?: string[],
): Record<string, unknown> {
  const columns: Record<string, unknown> = {};
  const targetFields = fields ?? definition.fields.map((field) => field.name);

  for (const fieldName of targetFields) {
    if (!Object.hasOwn(data, fieldName)) {
      continue;
    }

    const field = fieldByName(definition, fieldName);
    if (!field) {
      continue;
    }

    columns[toColumnName(fieldName)] = serializeFieldValue(field, data[fieldName]);
  }

  return columns;
}

export function columnToFieldName(column: string): string {
  return COLUMN_TO_FIELD[column] ?? column.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}
