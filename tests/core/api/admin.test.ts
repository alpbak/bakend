import { afterEach, describe, expect, test } from "bun:test";
import { createTestServer } from "../../helpers/test-server.ts";

async function registerAdmin(
  baseUrl: string,
  email = "admin@example.com",
  password = "password123",
): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = (await response.json()) as { token: string; user: { role: string } };
  expect(body.user.role).toBe("admin");
  return body.token;
}

async function registerUser(baseUrl: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user@example.com", password: "password123" }),
  });

  const body = (await response.json()) as { token: string; user: { role: string } };
  expect(body.user.role).toBe("authenticated");
  return body.token;
}

describe("admin API", () => {
  let db: ReturnType<typeof createTestServer>["db"] | undefined;
  let server: ReturnType<typeof createTestServer>["server"] | undefined;

  afterEach(() => {
    delete process.env.BAKEND_ADMIN_EMAIL;
    server?.stop();
    server = undefined;
    db?.close();
    db = undefined;
  });

  test("GET /api/auth/me returns current user", async () => {
    process.env.BAKEND_ADMIN_EMAIL = "admin@example.com";
    const context = createTestServer();
    db = context.db;
    server = context.server;
    const baseUrl = `http://127.0.0.1:${server.port}`;
    const token = await registerAdmin(baseUrl);

    const response = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { user: { email: string; role: string } };
    expect(body.user.email).toBe("admin@example.com");
    expect(body.user.role).toBe("admin");
  });

  test("admin routes reject unauthenticated requests", async () => {
    const context = createTestServer();
    db = context.db;
    server = context.server;
    const baseUrl = `http://127.0.0.1:${server.port}`;

    const response = await fetch(`${baseUrl}/api/admin/collections`);
    expect(response.status).toBe(401);
  });

  test("admin routes reject non-admin users", async () => {
    const context = createTestServer();
    db = context.db;
    server = context.server;
    const baseUrl = `http://127.0.0.1:${server.port}`;
    const token = await registerUser(baseUrl);

    const response = await fetch(`${baseUrl}/api/admin/collections`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(403);
  });

  test("admin can manage collections", async () => {
    process.env.BAKEND_ADMIN_EMAIL = "admin@example.com";
    const context = createTestServer();
    db = context.db;
    server = context.server;
    const baseUrl = `http://127.0.0.1:${server.port}`;
    const token = await registerAdmin(baseUrl);
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const createResponse = await fetch(`${baseUrl}/api/admin/collections`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "posts",
        fields: [{ name: "title", type: "string", required: true }],
      }),
    });
    expect(createResponse.status).toBe(201);

    const listResponse = await fetch(`${baseUrl}/api/admin/collections`, { headers });
    const listBody = (await listResponse.json()) as { items: Array<{ name: string }> };
    expect(listBody.items.some((item) => item.name === "posts")).toBe(true);

    const updateResponse = await fetch(`${baseUrl}/api/admin/collections/posts`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        name: "posts",
        fields: [
          { name: "title", type: "string", required: true },
          { name: "content", type: "text" },
        ],
      }),
    });
    expect(updateResponse.status).toBe(200);

    const deleteResponse = await fetch(`${baseUrl}/api/admin/collections/posts`, {
      method: "DELETE",
      headers,
    });
    expect(deleteResponse.status).toBe(204);
  });

  test("admin can list and manage users", async () => {
    process.env.BAKEND_ADMIN_EMAIL = "admin@example.com";
    const context = createTestServer();
    db = context.db;
    server = context.server;
    const baseUrl = `http://127.0.0.1:${server.port}`;
    const adminToken = await registerAdmin(baseUrl);
    await registerUser(baseUrl);

    const headers = {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    };

    const listResponse = await fetch(`${baseUrl}/api/admin/users`, { headers });
    expect(listResponse.status).toBe(200);
    const listBody = (await listResponse.json()) as {
      items: Array<{ id: string; role: string }>;
      total: number;
    };
    expect(listBody.total).toBeGreaterThanOrEqual(2);

    const user = listBody.items.find((item) => item.role === "authenticated");
    expect(user).toBeDefined();

    const patchResponse = await fetch(`${baseUrl}/api/admin/users/${user!.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ role: "admin" }),
    });
    expect(patchResponse.status).toBe(200);
  });

  test("admin can list storage, functions, jobs, and logs", async () => {
    process.env.BAKEND_ADMIN_EMAIL = "admin@example.com";
    const context = createTestServer();
    db = context.db;
    server = context.server;
    const baseUrl = `http://127.0.0.1:${server.port}`;
    const token = await registerAdmin(baseUrl);
    const headers = { Authorization: `Bearer ${token}` };

    context.logger.error("test log entry");

    const storageResponse = await fetch(`${baseUrl}/api/admin/storage`, { headers });
    expect(storageResponse.status).toBe(200);

    const functionsResponse = await fetch(`${baseUrl}/api/admin/functions`, { headers });
    expect(functionsResponse.status).toBe(200);

    const jobsResponse = await fetch(`${baseUrl}/api/admin/jobs`, { headers });
    expect(jobsResponse.status).toBe(200);

    const logsResponse = await fetch(`${baseUrl}/api/admin/logs`, { headers });
    expect(logsResponse.status).toBe(200);
    const logsBody = (await logsResponse.json()) as { items: Array<{ message: string }> };
    expect(logsBody.items.some((entry) => entry.message.includes("test log entry"))).toBe(true);
  });
});
