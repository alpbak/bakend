import { afterEach, describe, expect, test } from "bun:test";
import { createTestServer } from "../../helpers/test-server.ts";

describe("createServer", () => {
  let server: ReturnType<typeof createTestServer>["server"] | undefined;
  let db: ReturnType<typeof createTestServer>["db"] | undefined;

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
