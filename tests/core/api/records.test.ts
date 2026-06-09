import { afterEach, describe, expect, test } from "bun:test";
import { createTestServer } from "../../helpers/test-server.ts";

describe("records API", () => {
  let db: ReturnType<typeof createTestServer>["db"] | undefined;
  let server: ReturnType<typeof createTestServer>["server"] | undefined;

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
    context.collections.create({
      name: "posts",
      fields: [{ name: "title", type: "string", required: true }],
    });

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

  test("returns 404 for unknown collection", async () => {
    const context = createTestServer();
    db = context.db;
    server = context.server;

    const response = await fetch(`http://127.0.0.1:${server.port}/api/unknown`);
    expect(response.status).toBe(404);
  });

  test("returns validation error for invalid record", async () => {
    const context = createTestServer();
    db = context.db;
    server = context.server;
    context.collections.create({
      name: "posts",
      fields: [{ name: "title", type: "string", required: true }],
    });

    const response = await fetch(`http://127.0.0.1:${server.port}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("validation_error");
  });
});
