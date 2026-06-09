import type { Database } from "bun:sqlite";
import { generateIndexSql } from "./generate-schema.ts";
import { toColumnName, quoteIdentifier } from "./naming.ts";
import type { CollectionDefinition, FieldDefinition } from "./types.ts";
import { CollectionError } from "./types.ts";

function columnType(field: FieldDefinition): string {
  switch (field.type) {
    case "integer":
      return "INTEGER";
    case "float":
      return "REAL";
    case "boolean":
      return "INTEGER";
    default:
      return "TEXT";
  }
}

function ddlRelevantField(field: FieldDefinition): string {
  return JSON.stringify({
    type: field.type,
    required: !!field.required,
    unique: !!field.unique,
  });
}

function generateAddColumnSql(tableName: string, field: FieldDefinition): string {
  const column = quoteIdentifier(toColumnName(field.name));
  const type = columnType(field);
  const constraints: string[] = [];

  if (field.required) {
    constraints.push("NOT NULL");
  }

  if (field.unique) {
    constraints.push("UNIQUE");
  }

  const suffix = constraints.length > 0 ? ` ${constraints.join(" ")}` : "";
  return `ALTER TABLE ${quoteIdentifier(tableName)} ADD COLUMN ${column} ${type}${suffix};`;
}

function generateRenameColumnSql(
  tableName: string,
  oldField: FieldDefinition,
  newField: FieldDefinition,
): string {
  const oldColumn = quoteIdentifier(toColumnName(oldField.name));
  const newColumn = quoteIdentifier(toColumnName(newField.name));
  return `ALTER TABLE ${quoteIdentifier(tableName)} RENAME COLUMN ${oldColumn} TO ${newColumn};`;
}

function generateDropColumnSql(tableName: string, field: FieldDefinition): string {
  const column = quoteIdentifier(toColumnName(field.name));
  return `ALTER TABLE ${quoteIdentifier(tableName)} DROP COLUMN ${column};`;
}

export interface SchemaMigrationPlan {
  statements: string[];
  indexStatements: string[];
}

export function planSchemaMigration(
  tableName: string,
  oldDefinition: CollectionDefinition,
  newDefinition: CollectionDefinition,
): SchemaMigrationPlan {
  if (oldDefinition.name !== newDefinition.name) {
    throw new CollectionError("Collection name cannot be changed");
  }

  const oldByName = new Map(oldDefinition.fields.map((field) => [field.name, field]));
  const newByName = new Map(newDefinition.fields.map((field) => [field.name, field]));

  for (const [name, oldField] of oldByName) {
    const newField = newByName.get(name);
    if (newField && ddlRelevantField(oldField) !== ddlRelevantField(newField)) {
      throw new CollectionError(
        `Cannot change type or constraints on existing field "${name}"`,
      );
    }
  }

  const statements: string[] = [];
  const unchangedNames = new Set<string>();

  for (const [name] of oldByName) {
    if (newByName.has(name)) {
      unchangedNames.add(name);
    }
  }

  const removedFields = oldDefinition.fields.filter((field) => !newByName.has(field.name));
  const addedFields = newDefinition.fields.filter((field) => !oldByName.has(field.name));

  const renamePairs: Array<{ oldField: FieldDefinition; newField: FieldDefinition }> = [];
  const unmatchedRemoved = [...removedFields];
  const unmatchedAdded = [...addedFields];

  for (const removed of [...unmatchedRemoved]) {
    const matchIndex = unmatchedAdded.findIndex(
      (added) => ddlRelevantField(removed) === ddlRelevantField(added),
    );
    if (matchIndex === -1) {
      continue;
    }

    const added = unmatchedAdded[matchIndex];
    if (!added) {
      continue;
    }

    renamePairs.push({ oldField: removed, newField: added });
    unmatchedRemoved.splice(unmatchedRemoved.indexOf(removed), 1);
    unmatchedAdded.splice(matchIndex, 1);
  }

  if (unmatchedRemoved.length > 0 && unmatchedAdded.length > 0) {
    throw new CollectionError(
      "Ambiguous schema change: could not match removed and added fields as renames",
    );
  }

  for (const pair of renamePairs) {
    statements.push(generateRenameColumnSql(tableName, pair.oldField, pair.newField));
  }

  for (const field of unmatchedAdded) {
    statements.push(generateAddColumnSql(tableName, field));
  }

  for (const field of unmatchedRemoved) {
    statements.push(generateDropColumnSql(tableName, field));
  }

  const indexStatements: string[] = [];
  for (const field of newDefinition.fields) {
    if (field.type === "relation" && !oldByName.has(field.name)) {
      indexStatements.push(
        ...generateIndexSql({ name: tableName, fields: [field] }),
      );
    }
  }

  return { statements, indexStatements };
}

export function applySchemaMigration(
  db: Database,
  tableName: string,
  oldDefinition: CollectionDefinition,
  newDefinition: CollectionDefinition,
): void {
  const plan = planSchemaMigration(tableName, oldDefinition, newDefinition);

  if (plan.statements.length === 0 && plan.indexStatements.length === 0) {
    return;
  }

  db.run("BEGIN");
  try {
    for (const statement of plan.statements) {
      db.run(statement);
    }
    for (const statement of plan.indexStatements) {
      db.run(statement);
    }
    db.run("COMMIT");
  } catch (error) {
    db.run("ROLLBACK");
    throw new CollectionError(`Schema migration failed: ${String(error)}`);
  }
}

export function findRelationDependents(
  allDefinitions: CollectionDefinition[],
  targetName: string,
): string[] {
  const dependents: string[] = [];

  for (const definition of allDefinitions) {
    for (const field of definition.fields) {
      if (field.type === "relation" && field.collection === targetName) {
        dependents.push(definition.name);
      }
    }
  }

  return dependents;
}
