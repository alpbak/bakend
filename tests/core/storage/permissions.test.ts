import { describe, expect, test } from "bun:test";
import { canDeleteFile, canReadFile } from "../../../src/core/storage/permissions.ts";
import type { FileMetadata } from "../../../src/core/storage/types.ts";

const file: FileMetadata = {
  id: "fil_1",
  filename: "test.txt",
  mimeType: "text/plain",
  size: 10,
  visibility: "protected",
  userId: "usr_owner",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const ownerContext = {
  user: { id: "usr_owner", email: "owner@test.com", role: "authenticated" as const, createdAt: "" },
};

const otherContext = {
  user: { id: "usr_other", email: "other@test.com", role: "authenticated" as const, createdAt: "" },
};

const adminContext = {
  user: { id: "usr_admin", email: "admin@test.com", role: "admin" as const, createdAt: "" },
};

describe("storage permissions", () => {
  test("public files are readable without auth", () => {
    const publicFile = { ...file, visibility: "public" as const };
    expect(canReadFile(publicFile, null)).toBe(true);
  });

  test("protected files require auth", () => {
    expect(canReadFile(file, null)).toBe(false);
    expect(canReadFile(file, ownerContext)).toBe(true);
    expect(canReadFile(file, otherContext)).toBe(false);
    expect(canReadFile(file, adminContext)).toBe(true);
  });

  test("delete requires owner or admin", () => {
    expect(canDeleteFile(file, null)).toBe(false);
    expect(canDeleteFile(file, ownerContext)).toBe(true);
    expect(canDeleteFile(file, otherContext)).toBe(false);
    expect(canDeleteFile(file, adminContext)).toBe(true);
  });
});
