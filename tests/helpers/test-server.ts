import { Database } from "bun:sqlite";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAuthEngine } from "../../src/core/auth/create-auth-engine.ts";
import { createCollectionsEngine } from "../../src/core/collections/create-collections-engine.ts";
import { createRecordStore } from "../../src/core/collections/record-store.ts";
import { DEFAULT_CONFIG } from "../../src/core/config/defaults.ts";
import { createEventBus } from "../../src/core/events/create-event-bus.ts";
import { createLogger } from "../../src/core/logging/logger.ts";
import { createRealtimeEngine } from "../../src/core/realtime/create-realtime-engine.ts";
import { createServer } from "../../src/core/server/create-server.ts";
import { createTestStorage } from "./test-storage.ts";

export const TEST_BOOTSTRAP_SQL = `
  CREATE TABLE IF NOT EXISTS _bakend_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS _collections (
    name TEXT PRIMARY KEY,
    definition TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS _users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'authenticated',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS _sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES _users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS _files (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    visibility TEXT NOT NULL CHECK (visibility IN ('public', 'protected')),
    user_id TEXT NOT NULL REFERENCES _users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export function createTestServer() {
  const storageRoot = mkdtempSync(join(tmpdir(), "bakend-test-storage-"));
  const db = new Database(":memory:");
  db.run(TEST_BOOTSTRAP_SQL);
  const logger = createLogger("ERROR");
  const eventBus = createEventBus(logger);
  const { storage } = createTestStorage(db, logger, eventBus, storageRoot);
  const collections = createCollectionsEngine({ db, logger, eventBus, storage });
  const recordStore = createRecordStore({ db, collections, logger, eventBus });
  const config = {
    ...DEFAULT_CONFIG,
    port: 0,
    database: ":memory:",
    storage: storageRoot,
    logLevel: "ERROR" as const,
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
  });

  const realtime = createRealtimeEngine({ eventBus, collections, logger });
  const server = createServer(config, logger, {
    collections,
    recordStore,
    auth,
    storage,
    realtime,
  });

  return {
    db,
    server,
    eventBus,
    collections,
    recordStore,
    auth,
    storage,
    realtime,
    config,
    storageRoot,
  };
}
