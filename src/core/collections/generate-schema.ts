import { toColumnName, quoteIdentifier } from "./naming.ts";
import type { CollectionDefinition, FieldDefinition } from "./types.ts";

function columnType(field: FieldDefinition): string {
  switch (field.type) {
    case "integer":
      return "INTEGER";
    case "float":
      return "REAL";
    case "boolean":
      return "INTEGER";
    case "string":
    case "text":
    case "datetime":
    case "json":
    case "relation":
    case "file":
      return "TEXT";
    default:
      return "TEXT";
  }
}

export function generateCreateTableSql(definition: CollectionDefinition): string {
  const tableName = quoteIdentifier(definition.name);
  const columns = [
    `${quoteIdentifier("id")} TEXT PRIMARY KEY`,
    `${quoteIdentifier("created_at")} TEXT NOT NULL`,
    `${quoteIdentifier("updated_at")} TEXT NOT NULL`,
  ];

  for (const field of definition.fields) {
    const column = quoteIdentifier(toColumnName(field.name));
    const type = columnType(field);
    const constraints: string[] = [];

    if (field.required) {
      constraints.push("NOT NULL");
    }

    if (field.unique) {
      constraints.push("UNIQUE");
    }

    columns.push(`${column} ${type}${constraints.length > 0 ? ` ${constraints.join(" ")}` : ""}`);
  }

  return `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${columns.join(",\n  ")}\n);`;
}

export function generateIndexSql(definition: CollectionDefinition): string[] {
  const statements: string[] = [];

  for (const field of definition.fields) {
    const column = quoteIdentifier(toColumnName(field.name));

    if (field.type === "relation") {
      statements.push(
        `CREATE INDEX IF NOT EXISTS ${quoteIdentifier(`idx_${definition.name}_${field.name}`)} ON ${quoteIdentifier(definition.name)} (${column});`,
      );
    }
  }

  return statements;
}

export function generateTableDDL(definition: CollectionDefinition): string[] {
  return [generateCreateTableSql(definition), ...generateIndexSql(definition)];
}
