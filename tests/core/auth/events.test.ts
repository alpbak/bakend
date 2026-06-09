import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAuthEngine } from "../../../src/core/auth/create-auth-engine.ts";
import { DEFAULT_CONFIG } from "../../../src/core/config/defaults.ts";
import { initDatabase, closeDatabase } from "../../../src/core/database/init.ts";
import { createEventBus } from "../../../src/core/events/create-event-bus.ts";
import { createFunctionsEngine } from "../../../src/core/functions/create-functions-engine.ts";
import { createLogger } from "../../../src/core/logging/logger.ts";
import { createTestStorage } from "../../helpers/test-storage.ts";

describe.serial("auth events", () => {
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

  test("auth.register executes onRegister handlers", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-auth-events-"));
    const functionsDir = join(tempDir, "functions", "users");
    const markerPath = join(tempDir, "register-marker.txt");
    mkdirSync(functionsDir, { recursive: true });

    writeFileSync(
      join(functionsDir, "welcome.ts"),
      `import { onRegister } from "bakend/functions";

const markerPath = ${JSON.stringify(markerPath)};

onRegister("users", async ({ record, auth }) => {
  await Bun.write(markerPath, JSON.stringify({ email: record.email, userId: auth.user?.id ?? "" }));
});
`,
    );

    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    const config = {
      ...DEFAULT_CONFIG,
      database: join(tempDir, "bakend.db"),
      auth: {
        jwtSecret: "test-secret-key-for-jwt-signing",
        accessTokenTtl: "15m",
        refreshTokenTtl: "7d",
      },
    };

    db = initDatabase(config, logger);
    const { storage } = createTestStorage(db, logger, eventBus, join(tempDir, "storage"));

    const functions = createFunctionsEngine({
      eventBus,
      db,
      logger,
      functionsDir: join(tempDir, "functions"),
      storage,
    });
    await functions.load();

    const auth = createAuthEngine({ db, logger, eventBus, config });
    const tokens = await auth.register("newuser@example.com", "password123");

    await new Promise((resolve) => setTimeout(resolve, 50));

    const marker = await Bun.file(markerPath).text();
    const payload = JSON.parse(marker) as { email: string; userId: string };
    expect(payload.email).toBe("newuser@example.com");
    expect(payload.userId).toBe(tokens.user.id);

    functions.shutdown();
  });
});
