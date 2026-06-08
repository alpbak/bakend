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

  collections.create({
    name: "posts",
    fields: [{ name: "title", type: "string", required: true }],
  });

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

  return { db, server, eventBus };
}

describe("records API", () => {
  let db: Database | undefined;
  let server: ReturnType<typeof createServer> | undefined;

  afterEach(() => {
    server?.stop();
    server = undefined;
    db?.close();
    db = undefined;
  });

  test("creates, lists, reads, updates, and deletes records", async () => {
    const context = createTestServer();
    db = context.db;
    server = context.server;
    const baseUrl = `http://127.0.0.1:${server.port}`;

    const createResponse = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Hello" }),
    });

    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as { id: string; title: string };
    expect(created.id).toMatch(/^rec_/);
    expect(created.title).toBe("Hello");

    const listResponse = await fetch(`${baseUrl}/api/posts`);
    expect(listResponse.status).toBe(200);
    const listBody = (await listResponse.json()) as { items: Array<{ id: string }> };
    expect(listBody.items).toHaveLength(1);
    expect(listBody.items[0]?.id).toBe(created.id);

    const getResponse = await fetch(`${baseUrl}/api/posts/${created.id}`);
    expect(getResponse.status).toBe(200);

    const updateResponse = await fetch(`${baseUrl}/api/posts/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    expect(updateResponse.status).toBe(200);
    const updated = (await updateResponse.json()) as { title: string };
    expect(updated.title).toBe("Updated");

    const deleteResponse = await fetch(`${baseUrl}/api/posts/${created.id}`, {
      method: "DELETE",
    });
    expect(deleteResponse.status).toBe(204);

    const missingResponse = await fetch(`${baseUrl}/api/posts/${created.id}`);
    expect(missingResponse.status).toBe(404);
  });

  test("returns validation errors", async () => {
    const context = createTestServer();
    db = context.db;
    server = context.server;

    const response = await fetch(`http://127.0.0.1:${server.port}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as {
      error: { code: string; details: Array<{ field: string }> };
    };
    expect(body.error.code).toBe("validation_error");
    expect(body.error.details[0]?.field).toBe("title");
  });

  test("returns 404 for unknown collection", async () => {
    const context = createTestServer();
    db = context.db;
    server = context.server;

    const response = await fetch(`http://127.0.0.1:${server.port}/api/missing`);
    expect(response.status).toBe(404);
  });

  test("returns 405 for unsupported methods", async () => {
    const context = createTestServer();
    db = context.db;
    server = context.server;

    const response = await fetch(`http://127.0.0.1:${server.port}/api/posts`, {
      method: "DELETE",
    });
    expect(response.status).toBe(405);
  });

  test("returns 400 for invalid JSON body", async () => {
    const context = createTestServer();
    db = context.db;
    server = context.server;

    const response = await fetch(`http://127.0.0.1:${server.port}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });

    expect(response.status).toBe(400);
  });

  test("health endpoints still work", async () => {
    const context = createTestServer();
    db = context.db;
    server = context.server;

    const response = await fetch(`http://127.0.0.1:${server.port}/health`);
    expect(response.status).toBe(200);
  });
});
