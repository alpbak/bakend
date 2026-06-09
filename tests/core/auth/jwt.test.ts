import { describe, expect, test } from "bun:test";
import { issueAccessToken, verifyAccessToken } from "../../../src/core/auth/jwt.ts";
import type { AuthUser } from "../../../src/core/auth/types.ts";

const user: AuthUser = {
  id: "usr_test",
  email: "test@example.com",
  role: "authenticated",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("jwt", () => {
  test("issues and verifies access tokens", async () => {
    const token = await issueAccessToken(user, "test-secret", "15m");
    const verified = await verifyAccessToken(token, "test-secret");
    expect(verified?.id).toBe(user.id);
    expect(verified?.role).toBe(user.role);
  });

  test("rejects invalid tokens", async () => {
    const token = await issueAccessToken(user, "test-secret", "15m");
    expect(await verifyAccessToken(token, "wrong-secret")).toBeNull();
    expect(await verifyAccessToken("not-a-jwt", "test-secret")).toBeNull();
  });
});
