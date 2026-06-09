import { describe, expect, test } from "bun:test";
import {
  checkCollectionPermission,
  checkPermission,
  getPermissionRule,
} from "../../../src/core/auth/permissions.ts";
import type { AuthContext } from "../../../src/core/auth/types.ts";
import type { CollectionDefinition } from "../../../src/core/collections/types.ts";

const definition: CollectionDefinition = {
  name: "posts",
  fields: [{ name: "user_id", type: "string" }],
  permissions: {
    create: "authenticated",
    read: "public",
    update: "owner",
    delete: "admin",
  },
};

const authContext: AuthContext = {
  user: {
    id: "usr_1",
    email: "user@example.com",
    role: "authenticated",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
};

const adminContext: AuthContext = {
  user: {
    id: "usr_admin",
    email: "admin@example.com",
    role: "admin",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
};

describe("permissions", () => {
  test("defaults to public when permissions are omitted", () => {
    const open: CollectionDefinition = {
      name: "notes",
      fields: [{ name: "title", type: "string" }],
    };
    expect(getPermissionRule(open, "read")).toBe("public");
  });

  test("enforces authenticated, owner, and admin rules", () => {
    expect(checkPermission("public", null)).toBe(true);
    expect(checkPermission("authenticated", null)).toBe(false);
    expect(checkPermission("authenticated", authContext)).toBe(true);
    expect(checkPermission("owner", authContext, { user_id: "usr_1" })).toBe(true);
    expect(checkPermission("owner", authContext, { user_id: "usr_2" })).toBe(false);
    expect(checkPermission("admin", authContext)).toBe(false);
    expect(checkPermission("admin", adminContext)).toBe(true);
  });

  test("checks collection permissions by operation", () => {
    expect(checkCollectionPermission(definition, "create", null)).toBe(false);
    expect(checkCollectionPermission(definition, "create", authContext)).toBe(true);
    expect(checkCollectionPermission(definition, "read", null)).toBe(true);
    expect(
      checkCollectionPermission(definition, "update", authContext, { user_id: "usr_1" }),
    ).toBe(true);
    expect(
      checkCollectionPermission(definition, "delete", authContext, { user_id: "usr_1" }),
    ).toBe(false);
    expect(
      checkCollectionPermission(definition, "delete", adminContext, { user_id: "usr_1" }),
    ).toBe(true);
  });
});
