import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { printStartupBanner, start } from "../../src/cli/start.ts";

describe("start", () => {
  let tempDir = "";
  let result: Awaited<ReturnType<typeof start>> | undefined;

  afterEach(() => {
    result?.shutdown();
    result = undefined;

    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  test("prints startup banner", () => {
    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };

    try {
      printStartupBanner(8080);
    } finally {
      console.log = originalLog;
    }

    expect(lines).toEqual([
      "Bakend v1.0",
      "",
      "Database: ready",
      "API: ready",
      "",
      "Listening on :8080",
    ]);
  });

  test("starts server and responds to health checks", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-start-"));
    const configPath = join(tempDir, "bakend.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        port: 19080,
        database: join(tempDir, "bakend.db"),
        storage: join(tempDir, "storage"),
        logLevel: "ERROR",
      }),
    );

    result = await start({ configPath });

    expect(result.eventBus).toBeDefined();
    expect(typeof result.eventBus.emit).toBe("function");
    expect(typeof result.eventBus.on).toBe("function");
    expect(result.collections).toBeDefined();
    expect(typeof result.collections.create).toBe("function");
    expect(result.jobs).toBeDefined();
    expect(typeof result.jobs.load).toBe("function");

    const response = await fetch(`http://127.0.0.1:${result.server.port}/health`);
    expect(response.status).toBe(200);

    const body = (await response.json()) as { status: string; version: string };
    expect(body.status).toBe("ok");
    expect(body.version).toBe("1.0.0");
  });

  test("loads collections from collections/*.json at startup", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-start-"));
    const configPath = join(tempDir, "bakend.json");
    const collectionsDir = join(tempDir, "collections");
    mkdirSync(collectionsDir, { recursive: true });

    writeFileSync(
      configPath,
      JSON.stringify({
        port: 19081,
        database: join(tempDir, "bakend.db"),
        storage: join(tempDir, "storage"),
        logLevel: "ERROR",
      }),
    );

    writeFileSync(
      join(collectionsDir, "posts.json"),
      JSON.stringify({
        name: "posts",
        fields: [{ name: "title", type: "string", required: true }],
      }),
    );

    result = await start({ configPath });

    expect(result.collections.list().map((collection) => collection.name)).toEqual(["posts"]);
  });

  test("serves CRUD API for loaded collections", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-start-"));
    const configPath = join(tempDir, "bakend.json");
    const collectionsDir = join(tempDir, "collections");
    mkdirSync(collectionsDir, { recursive: true });

    writeFileSync(
      configPath,
      JSON.stringify({
        port: 19082,
        database: join(tempDir, "bakend.db"),
        storage: join(tempDir, "storage"),
        logLevel: "ERROR",
      }),
    );

    writeFileSync(
      join(collectionsDir, "posts.json"),
      JSON.stringify({
        name: "posts",
        fields: [{ name: "title", type: "string", required: true }],
      }),
    );

    result = await start({ configPath });

    const createResponse = await fetch(`http://127.0.0.1:${result.server.port}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Hello" }),
    });

    expect(createResponse.status).toBe(201);

    const listResponse = await fetch(`http://127.0.0.1:${result.server.port}/api/posts`);
    expect(listResponse.status).toBe(200);

    const listBody = (await listResponse.json()) as { items: unknown[] };
    expect(listBody.items).toHaveLength(1);
  });

  test("runs functions on record creation", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-start-"));
    const configPath = join(tempDir, "bakend.json");
    const collectionsDir = join(tempDir, "collections");
    const functionsDir = join(tempDir, "functions");
    const postsFunctionsDir = join(functionsDir, "posts");
    const markerPath = join(tempDir, "function-ran.txt");

    mkdirSync(collectionsDir, { recursive: true });
    mkdirSync(postsFunctionsDir, { recursive: true });

    writeFileSync(
      configPath,
      JSON.stringify({
        port: 19083,
        database: join(tempDir, "bakend.db"),
        storage: join(tempDir, "storage"),
        logLevel: "ERROR",
      }),
    );

    writeFileSync(
      join(collectionsDir, "posts.json"),
      JSON.stringify({
        name: "posts",
        fields: [{ name: "title", type: "string", required: true }],
      }),
    );

    writeFileSync(
      join(postsFunctionsDir, "handler.ts"),
      `import { onCreate } from "bakend/functions";

onCreate("posts", async ({ record }) => {
  await Bun.write(${JSON.stringify(markerPath)}, String(record.title));
});
`,
    );

    result = await start({ configPath });

    expect(result.functions.list()).toHaveLength(1);

    const createResponse = await fetch(`http://127.0.0.1:${result.server.port}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "FromFunction" }),
    });

    expect(createResponse.status).toBe(201);
    await result.eventBus.flush();

    const marker = await Bun.file(markerPath).text();
    expect(marker).toBe("FromFunction");
  });

  test("loads jobs from jobs/*.ts at startup", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-start-"));
    const configPath = join(tempDir, "bakend.json");
    const jobsDir = join(tempDir, "jobs");
    mkdirSync(jobsDir, { recursive: true });

    writeFileSync(
      configPath,
      JSON.stringify({
        port: 19084,
        database: join(tempDir, "bakend.db"),
        storage: join(tempDir, "storage"),
        logLevel: "ERROR",
      }),
    );

    writeFileSync(
      join(jobsDir, "heartbeat.ts"),
      `export const schedule = "0 3 * * *";

export default async () => {};
`,
    );

    result = await start({ configPath });

    expect(result.jobs.list()).toHaveLength(1);
    expect(result.jobs.list()[0]?.name).toBe("heartbeat");
    expect(result.jobs.list()[0]?.schedule).toBe("0 3 * * *");
  });
});
