import type {
  CollectionDefinition,
  CollectionPermissions,
  PermissionOperation,
  PermissionRule,
} from "../collections/types.ts";
import type { AuthContext } from "./types.ts";

const DEFAULT_RULE: PermissionRule = "public";

export const OWNER_FIELD_NAME = "user_id";

export function getPermissionRule(
  definition: CollectionDefinition,
  operation: PermissionOperation,
): PermissionRule {
  return definition.permissions?.[operation] ?? DEFAULT_RULE;
}

export function hasOwnerField(definition: CollectionDefinition): boolean {
  return definition.fields.some(
    (field) =>
      field.name === OWNER_FIELD_NAME &&
      (field.type === "string" || field.type === "relation"),
  );
}

export function isAdmin(authContext: AuthContext | null): boolean {
  return authContext?.user.role === "admin";
}

export function checkPermission(
  rule: PermissionRule,
  authContext: AuthContext | null,
  record?: Record<string, unknown>,
): boolean {
  if (isAdmin(authContext)) {
    return true;
  }

  switch (rule) {
    case "public":
      return true;
    case "authenticated":
      return authContext !== null;
    case "admin":
      return authContext?.user.role === "admin";
    case "owner": {
      if (!authContext) {
        return false;
      }
      if (!record) {
        return false;
      }
      return record[OWNER_FIELD_NAME] === authContext.user.id;
    }
    default:
      return false;
  }
}

export function checkCollectionPermission(
  definition: CollectionDefinition,
  operation: PermissionOperation,
  authContext: AuthContext | null,
  record?: Record<string, unknown>,
): boolean {
  const rule = getPermissionRule(definition, operation);
  return checkPermission(rule, authContext, record);
}

export function shouldFilterListByOwner(definition: CollectionDefinition): boolean {
  return getPermissionRule(definition, "read") === "owner" && hasOwnerField(definition);
}

export function getDefaultPermissions(): CollectionPermissions {
  return {
    create: DEFAULT_RULE,
    read: DEFAULT_RULE,
    update: DEFAULT_RULE,
    delete: DEFAULT_RULE,
  };
}
