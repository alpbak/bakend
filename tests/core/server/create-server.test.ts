import { afterEach, describe, expect, test } from "bun:test";
import { createServer } from "../../../src/core/server/create-server.ts";
import { createLogger } from "../../../src/core/logging/logger.ts";

describe("createServer", () => {
  let server: ReturnType<typeof createServer> | undefined;

  afterEach(() => {
    server?.stop();
    server = undefined;
  });

  test("serves health endpoint", async () => {
    server = createServer(
      {
        port: 0,
        database: ":memory:",
        storage: "./storage",
        logLevel: "ERROR",
      },
      createLogger("ERROR"),
    );

    const response = await fetch(`http://127.0.0.1:${server.port}/health`);
    expect(response.status).toBe(200);

    const body = (await response.json()) as { status: string; version: string };
    expect(body.status).toBe("ok");
    expect(body.version).toBe("0.1.0");
  });

  test("serves root endpoint", async () => {
    server = createServer(
      {
        port: 0,
        database: ":memory:",
        storage: "./storage",
        logLevel: "ERROR",
      },
      createLogger("ERROR"),
    );

    const response = await fetch(`http://127.0.0.1:${server.port}/`);
    expect(response.status).toBe(200);
  });
});
