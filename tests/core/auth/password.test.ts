import { describe, expect, test } from "bun:test";
import { hashPassword, verifyPassword } from "../../../src/core/auth/password.ts";

describe("password", () => {
  test("hashes and verifies passwords", async () => {
    const hash = await hashPassword("secret-password");
    expect(hash).not.toBe("secret-password");
    expect(await verifyPassword("secret-password", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
});
