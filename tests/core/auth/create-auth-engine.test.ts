import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createAuthEngine } from "../../../src/core/auth/create-auth-engine.ts";
import {
  DuplicateEmailError,
  InvalidCredentialsError,
  InvalidTokenError,
} from "../../../src/core/auth/types.ts";
import { DEFAULT_CONFIG } from "../../../src/core/config/defaults.ts";
import { createEventBus } from "../../../src/core/events/create-event-bus.ts";
import { createLogger } from "../../../src/core/logging/logger.ts";
import { TEST_BOOTSTRAP_SQL } from "../../helpers/test-server.ts";

function createAuthFixture(adminEmail?: string) {
  const db = new Database(":memory:");
  db.run(TEST_BOOTSTRAP_SQL);
  const logger = createLogger("ERROR");
  const eventBus = createEventBus(logger);
  const config = {
    ...DEFAULT_CONFIG,
    database: ":memory:",
    auth: {
      jwtSecret: "test-secret-key-for-jwt-signing",
      accessTokenTtl: "15m",
      refreshTokenTtl: "7d",
    },
  };

  const auth = createAuthEngine({
    db,
    logger,
    eventBus,
    config,
    adminEmail,
  });

  return { db, auth, eventBus };
}

describe("createAuthEngine", () => {
  let db: Database | undefined;

  afterEach(() => {
    db?.close();
    db = undefined;
  });

  test("registers, logs in, refreshes, and logs out", async () => {
    const context = createAuthFixture();
    db = context.db;

    const registered = await context.auth.register("user@example.com", "password123");
    expect(registered.user.email).toBe("user@example.com");
    expect(registered.token).toBeTruthy();
    expect(registered.refreshToken).toBeTruthy();
    expect(registered.user).not.toHaveProperty("passwordHash");

    const loggedIn = await context.auth.login("user@example.com", "password123");
    expect(loggedIn.user.id).toBe(registered.user.id);

    const user = await context.auth.validateAccessToken(loggedIn.token);
    expect(user?.email).toBe("user@example.com");

    const refreshed = await context.auth.refresh(loggedIn.refreshToken);
    expect(refreshed.token).toBeTruthy();

    await context.auth.logout(refreshed.refreshToken);
    await expect(context.auth.refresh(refreshed.refreshToken)).rejects.toBeInstanceOf(
      InvalidTokenError,
    );
  });

  test("rejects duplicate email registration", async () => {
    const context = createAuthFixture();
    db = context.db;

    await context.auth.register("dup@example.com", "password123");
    await expect(context.auth.register("dup@example.com", "password123")).rejects.toBeInstanceOf(
      DuplicateEmailError,
    );
  });

  test("rejects invalid login credentials", async () => {
    const context = createAuthFixture();
    db = context.db;

    await context.auth.register("user@example.com", "password123");
    await expect(context.auth.login("user@example.com", "wrong-password")).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });

  test("promotes admin email on registration", async () => {
    const context = createAuthFixture("admin@example.com");
    db = context.db;

    const tokens = await context.auth.register("admin@example.com", "password123");
    expect(tokens.user.role).toBe("admin");
  });
});
