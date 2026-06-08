import type { Database, SQLQueryBindings } from "bun:sqlite";
import { toColumnName } from "./naming.ts";
import type {
  CollectionDefinition,
  FieldDefinition,
  RecordValidationMode,
  ValidationError,
  ValidationResult,
} from "./types.ts";

function invalid(field: string, rule: string, message: string): ValidationError {
  return { field, rule, message };
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function isValidIsoDate(value: string): boolean {
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
}

function validateFieldType(field: FieldDefinition, value: unknown): ValidationError | null {
  if (value === undefined || value === null) {
    return null;
  }

  switch (field.type) {
    case "string":
    case "text":
    case "datetime":
    case "relation":
    case "file":
      if (typeof value !== "string") {
        return invalid(field.name, "type", `Field "${field.name}" must be a string`);
      }
      if (field.type === "datetime" && !isValidIsoDate(value)) {
        return invalid(field.name, "type", `Field "${field.name}" must be a valid ISO-8601 datetime`);
      }
      return null;
    case "integer":
      if (typeof value !== "number" || !Number.isInteger(value)) {
        return invalid(field.name, "type", `Field "${field.name}" must be an integer`);
      }
      return null;
    case "float":
      if (typeof value !== "number" || Number.isNaN(value)) {
        return invalid(field.name, "type", `Field "${field.name}" must be a number`);
      }
      return null;
    case "boolean":
      if (typeof value !== "boolean") {
        return invalid(field.name, "type", `Field "${field.name}" must be a boolean`);
      }
      return null;
    case "json":
      if (typeof value !== "object") {
        return invalid(field.name, "type", `Field "${field.name}" must be a JSON value`);
      }
      return null;
    default:
      return null;
  }
}

function validateFieldRules(field: FieldDefinition, value: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (field.required && isEmpty(value)) {
    errors.push(invalid(field.name, "required", `Field "${field.name}" is required`));
    return errors;
  }

  if (value === undefined || value === null) {
    return errors;
  }

  const typeError = validateFieldType(field, value);
  if (typeError) {
    errors.push(typeError);
    return errors;
  }

  if (field.min !== undefined) {
    if (typeof value === "string" && value.length < field.min) {
      errors.push(
        invalid(field.name, "min", `Field "${field.name}" must be at least ${field.min} characters`),
      );
    } else if (typeof value === "number" && value < field.min) {
      errors.push(
        invalid(field.name, "min", `Field "${field.name}" must be at least ${field.min}`),
      );
    }
  }

  if (field.max !== undefined) {
    if (typeof value === "string" && value.length > field.max) {
      errors.push(
        invalid(field.name, "max", `Field "${field.name}" must be at most ${field.max} characters`),
      );
    } else if (typeof value === "number" && value > field.max) {
      errors.push(
        invalid(field.name, "max", `Field "${field.name}" must be at most ${field.max}`),
      );
    }
  }

  if (field.regex !== undefined && typeof value === "string") {
    const pattern = new RegExp(field.regex);
    if (!pattern.test(value)) {
      errors.push(
        invalid(field.name, "regex", `Field "${field.name}" does not match required pattern`),
      );
    }
  }

  return errors;
}

function checkUnique(
  db: Database,
  collectionName: string,
  field: FieldDefinition,
  value: unknown,
  excludeId?: string,
): ValidationError | null {
  if (!field.unique || value === undefined || value === null) {
    return null;
  }

  const column = toColumnName(field.name);
  const serialized =
    field.type === "json" ? JSON.stringify(value) : field.type === "boolean" ? (value ? 1 : 0) : value;

  let sql = `SELECT COUNT(*) as count FROM "${collectionName}" WHERE "${column}" = ?`;
  const params: SQLQueryBindings[] = [serialized as SQLQueryBindings];

  if (excludeId) {
    sql += ` AND "id" != ?`;
    params.push(excludeId);
  }

  const row = db.query<{ count: number }, SQLQueryBindings[]>(sql).get(...params);
  if (row && row.count > 0) {
    return invalid(field.name, "unique", `Field "${field.name}" must be unique`);
  }

  return null;
}

export function validateRecord(
  db: Database,
  definition: CollectionDefinition,
  data: Record<string, unknown>,
  mode: RecordValidationMode,
): ValidationResult {
  const errors: ValidationError[] = [];
  const excludeId = typeof data.id === "string" ? data.id : undefined;

  for (const field of definition.fields) {
    const value = data[field.name];
    const shouldValidate = mode === "create" || Object.hasOwn(data, field.name);

    if (!shouldValidate) {
      continue;
    }

    errors.push(...validateFieldRules(field, value));

    if (errors.some((error) => error.field === field.name)) {
      continue;
    }

    const uniqueError = checkUnique(db, definition.name, field, value, excludeId);
    if (uniqueError) {
      errors.push(uniqueError);
    }
  }

  return { valid: errors.length === 0, errors };
}
