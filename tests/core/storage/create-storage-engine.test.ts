import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initDatabase, closeDatabase } from "../../../src/core/database/init.ts";
import { createEventBus } from "../../../src/core/events/create-event-bus.ts";
import { createLogger } from "../../../src/core/logging/logger.ts";
import { DEFAULT_CONFIG } from "../../../src/core/config/defaults.ts";
import { createStorageEngine } from "../../../src/core/storage/create-storage-engine.ts";
import { EmptyFileError, FileTooLargeError, MAX_FILE_SIZE } from "../../../src/core/storage/types.ts";
import { createAuthEngine } from "../../../src/core/auth/create-auth-engine.ts";

describe("createStorageEngine", () => {
  let tempDir = "";
  let db: ReturnType<typeof initDatabase> | undefined;

  afterEach(() => {
    if (db) {
      closeDatabase(db);
      db = undefined;
    }

    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  function setup() {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-storage-engine-"));
    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    const config = {
      ...DEFAULT_CONFIG,
      database: join(tempDir, "bakend.db"),
      storage: join(tempDir, "storage"),
      auth: {
        jwtSecret: "test-secret-key-for-jwt-signing",
        accessTokenTtl: "15m",
        refreshTokenTtl: "7d",
      },
    };

    db = initDatabase(config, logger);
    const auth = createAuthEngine({ db, logger, eventBus, config });
    const storage = createStorageEngine({ db, config, logger, eventBus });

    return { storage, auth, eventBus, config, logger };
  }

  test("uploads file and emits storage.uploaded", async () => {
    const { storage, auth, eventBus } = setup();
    const tokens = await auth.register("u@test.com", "password123");

    let uploaded = false;
    eventBus.on("storage.uploaded", () => {
      uploaded = true;
    });

    const data = new TextEncoder().encode("hello");
    const metadata = await storage.upload(data, "hello.txt", "text/plain", "public", tokens.user.id);

    expect(metadata.id.startsWith("fil_")).toBe(true);
    expect(metadata.filename).toBe("hello.txt");
    expect(metadata.size).toBe(5);
    expect(metadata.visibility).toBe("public");
    expect(storage.exists(metadata.id)).toBe(true);
    expect(storage.read(metadata.id)?.toString()).toBe("hello");

    await eventBus.flush();
    expect(uploaded).toBe(true);
  });

  test("rejects empty files", async () => {
    const { storage, auth } = setup();
    const tokens = await auth.register("u@test.com", "password123");

    expect(() =>
      storage.upload(new Uint8Array(), "empty.txt", "text/plain", "public", tokens.user.id),
    ).toThrow(EmptyFileError);
  });

  test("rejects files over max size", async () => {
    const { storage, auth } = setup();
    const tokens = await auth.register("u@test.com", "password123");

    const data = new Uint8Array(MAX_FILE_SIZE + 1);
    expect(() =>
      storage.upload(data, "big.bin", "application/octet-stream", "protected", tokens.user.id),
    ).toThrow(FileTooLargeError);
  });

  test("delete removes file and emits storage.deleted", async () => {
    const { storage, auth, eventBus } = setup();
    const tokens = await auth.register("u@test.com", "password123");

    let deletedPayload: unknown;
    eventBus.on("storage.deleted", (event) => {
      deletedPayload = event.payload;
    });

    const metadata = await storage.upload(
      new TextEncoder().encode("bye"),
      "bye.txt",
      "text/plain",
      "protected",
      tokens.user.id,
    );

    const deleted = await storage.delete(metadata.id);
    expect(deleted).toBe(true);
    expect(storage.exists(metadata.id)).toBe(false);
    expect(storage.read(metadata.id)).toBeNull();

    await eventBus.flush();
    expect(deletedPayload).toEqual({ id: metadata.id, userId: tokens.user.id });
  });

  test("storage context get and delete work", async () => {
    const { storage, auth } = setup();
    const tokens = await auth.register("u@test.com", "password123");
    const ctx = storage.getContext();

    const metadata = await storage.upload(
      new TextEncoder().encode("ctx"),
      "ctx.txt",
      "text/plain",
      "public",
      tokens.user.id,
    );

    const found = await ctx.get(metadata.id);
    expect(found?.filename).toBe("ctx.txt");

    const deleted = await ctx.delete(metadata.id);
    expect(deleted).toBe(true);
    expect(await ctx.get(metadata.id)).toBeNull();
  });
});
