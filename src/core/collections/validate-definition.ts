import {
  FIELD_TYPES,
  NAME_PATTERN,
  RESERVED_COLLECTION_NAMES,
  SYSTEM_FIELD_NAMES,
  type CollectionDefinition,
  type FieldDefinition,
  type FieldType,
  type ValidationError,
  type ValidationResult,
} from "./types.ts";

const STRING_TYPES: FieldType[] = ["string", "text"];
const NUMERIC_TYPES: FieldType[] = ["integer", "float"];

export interface ValidateDefinitionOptions {
  existingCollections: string[];
}

function invalid(field: string, rule: string, message: string): ValidationError {
  return { field, rule, message };
}

function validateName(name: string, context: "collection" | "field"): ValidationError | null {
  if (!NAME_PATTERN.test(name)) {
    return invalid(
      name,
      "name",
      `${context} name "${name}" must match ^[a-z][a-z0-9_]*$`,
    );
  }

  if (name.startsWith("_")) {
    return invalid(name, "name", `${context} name "${name}" cannot start with "_"`);
  }

  return null;
}

function isRuleCompatible(field: FieldDefinition, rule: string): boolean {
  switch (rule) {
    case "required":
      return true;
    case "min":
    case "max":
      return STRING_TYPES.includes(field.type) || NUMERIC_TYPES.includes(field.type);
    case "regex":
      return STRING_TYPES.includes(field.type);
    case "unique":
      return field.type !== "json";
    default:
      return false;
  }
}

export function validateDefinition(
  definition: CollectionDefinition,
  options: ValidateDefinitionOptions,
): ValidationResult {
  const errors: ValidationError[] = [];

  const nameError = validateName(definition.name, "collection");
  if (nameError) {
    errors.push(nameError);
  }

  if (
    RESERVED_COLLECTION_NAMES.includes(
      definition.name as (typeof RESERVED_COLLECTION_NAMES)[number],
    )
  ) {
    errors.push(
      invalid(definition.name, "reserved", `Collection name "${definition.name}" is reserved`),
    );
  }

  if (options.existingCollections.includes(definition.name)) {
    errors.push(
      invalid(definition.name, "exists", `Collection "${definition.name}" already exists`),
    );
  }

  if (!Array.isArray(definition.fields)) {
    errors.push(invalid("fields", "type", "Collection fields must be an array"));
    return { valid: false, errors };
  }

  const seenFieldNames = new Set<string>();

  for (const field of definition.fields) {
    if (!field || typeof field.name !== "string" || typeof field.type !== "string") {
      errors.push(invalid("fields", "shape", "Each field must have a name and type"));
      continue;
    }

    const fieldNameError = validateName(field.name, "field");
    if (fieldNameError) {
      errors.push(fieldNameError);
    }

    if (SYSTEM_FIELD_NAMES.includes(field.name as (typeof SYSTEM_FIELD_NAMES)[number])) {
      errors.push(
        invalid(field.name, "reserved", `Field name "${field.name}" is reserved`),
      );
    }

    if (seenFieldNames.has(field.name)) {
      errors.push(
        invalid(field.name, "duplicate", `Duplicate field name "${field.name}"`),
      );
    }
    seenFieldNames.add(field.name);

    if (!FIELD_TYPES.includes(field.type as FieldType)) {
      errors.push(
        invalid(field.name, "type", `Unsupported field type "${field.type}"`),
      );
      continue;
    }

    if (field.type === "relation") {
      if (!field.collection || typeof field.collection !== "string") {
        errors.push(
          invalid(field.name, "relation", `Relation field "${field.name}" requires a collection`),
        );
      } else if (!options.existingCollections.includes(field.collection)) {
        errors.push(
          invalid(
            field.name,
            "relation",
            `Relation field "${field.name}" references unknown collection "${field.collection}"`,
          ),
        );
      }
    }

    if (field.min !== undefined && !isRuleCompatible(field, "min")) {
      errors.push(
        invalid(field.name, "min", `Field "${field.name}" does not support min`),
      );
    }

    if (field.max !== undefined && !isRuleCompatible(field, "max")) {
      errors.push(
        invalid(field.name, "max", `Field "${field.name}" does not support max`),
      );
    }

    if (field.regex !== undefined && !isRuleCompatible(field, "regex")) {
      errors.push(
        invalid(field.name, "regex", `Field "${field.name}" does not support regex`),
      );
    }

    if (field.unique !== undefined && !isRuleCompatible(field, "unique")) {
      errors.push(
        invalid(field.name, "unique", `Field "${field.name}" does not support unique`),
      );
    }

    if (
      field.min !== undefined &&
      field.max !== undefined &&
      field.min > field.max
    ) {
      errors.push(
        invalid(field.name, "range", `Field "${field.name}" has min greater than max`),
      );
    }

    if (field.regex !== undefined) {
      try {
        new RegExp(field.regex);
      } catch {
        errors.push(
          invalid(field.name, "regex", `Field "${field.name}" has invalid regex`),
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
