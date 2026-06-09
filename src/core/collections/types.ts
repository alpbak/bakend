export const FIELD_TYPES = [
  "string",
  "text",
  "integer",
  "float",
  "boolean",
  "datetime",
  "json",
  "relation",
  "file",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const SYSTEM_FIELD_NAMES = ["id", "createdAt", "updatedAt"] as const;

export const RESERVED_COLLECTION_NAMES = ["_bakend_meta", "_collections", "users"] as const;

export const PERMISSION_RULES = ["public", "authenticated", "owner", "admin"] as const;

export type PermissionRule = (typeof PERMISSION_RULES)[number];

export type PermissionOperation = "create" | "read" | "update" | "delete";

export interface CollectionPermissions {
  create?: PermissionRule;
  read?: PermissionRule;
  update?: PermissionRule;
  delete?: PermissionRule;
}

export const NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export interface FieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  min?: number;
  max?: number;
  regex?: string;
  unique?: boolean;
  collection?: string;
}

export interface CollectionDefinition {
  name: string;
  fields: FieldDefinition[];
  permissions?: CollectionPermissions;
}

export interface CollectionMeta {
  name: string;
  definition: CollectionDefinition;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export type RecordValidationMode = "create" | "update";

export interface CollectionsEngine {
  create(definition: CollectionDefinition): CollectionMeta;
  update(name: string, definition: CollectionDefinition): CollectionMeta;
  delete(name: string): void;
  get(name: string): CollectionMeta | null;
  list(): CollectionMeta[];
  exists(name: string): boolean;
  validateRecord(
    collection: string,
    data: Record<string, unknown>,
    mode: RecordValidationMode,
  ): ValidationResult;
}

export class CollectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CollectionError";
  }
}
