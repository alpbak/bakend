import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createCollectionsEngine } from "../../../src/core/collections/create-collections-engine.ts";
import { createRecordStore } from "../../../src/core/collections/record-store.ts";
import { createEventBus } from "../../../src/core/events/create-event-bus.ts";
import { createLogger } from "../../../src/core/logging/logger.ts";
import { createServer } from "../../../src/core/server/create-server.ts";

const BOOTSTRAP_SQL = `
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
`;

function createTestServer() {
  const db = new Database(":memory:");
  db.run(BOOTSTRAP_SQL);
  const logger = createLogger("ERROR");
  const eventBus = createEventBus(logger);
  const collections = createCollectionsEngine({ db, logger, eventBus });
  const recordStore = createRecordStore({ db, collections, logger, eventBus });

  const server = createServer(
    {
      port: 0,
      database: ":memory:",
      storage: "./storage",
      logLevel: "ERROR",
    },
    logger,
    { collections, recordStore },
  );

  return { db, server };
}

describe("createServer", () => {
  let server: ReturnType<typeof createServer> | undefined;
  let db: Database | undefined;

  afterEach(() => {
    server?.stop();
    server = undefined;
    db?.close();
    db = undefined;
  });

  test("serves health endpoint", async () => {
    const context = createTestServer();
    server = context.server;
    db = context.db;

    const response = await fetch(`http://127.0.0.1:${server.port}/health`);
    expect(response.status).toBe(200);

    const body = (await response.json()) as { status: string; version: string };
    expect(body.status).toBe("ok");
    expect(body.version).toBe("0.1.0");
  });

  test("serves root endpoint", async () => {
    const context = createTestServer();
    server = context.server;
    db = context.db;

    const response = await fetch(`http://127.0.0.1:${server.port}/`);
    expect(response.status).toBe(200);
  });
});
