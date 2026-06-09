import { afterEach, describe, expect, test } from "bun:test";
import { createTestServer } from "../../helpers/test-server.ts";

describe("auth API", () => {
  let db: ReturnType<typeof createTestServer>["db"] | undefined;
  let server: ReturnType<typeof createTestServer>["server"] | undefined;

  afterEach(() => {
    server?.stop();
    server = undefined;
    db?.close();
    db = undefined;
  });

  test("register, login, refresh, logout, and protected CRUD", async () => {
    const context = createTestServer();
    db = context.db;
    server = context.server;

    context.collections.create({
      name: "posts",
      fields: [
        { name: "title", type: "string", required: true },
        { name: "user_id", type: "string" },
      ],
      permissions: {
        create: "authenticated",
        read: "public",
        update: "owner",
        delete: "owner",
      },
    });

    const baseUrl = `http://127.0.0.1:${server.port}`;

    const unauthCreate = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Blocked" }),
    });
    expect(unauthCreate.status).toBe(401);

    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "writer@example.com", password: "password123" }),
    });
    expect(registerResponse.status).toBe(201);
    const registered = (await registerResponse.json()) as {
      token: string;
      refreshToken: string;
      user: { id: string; email: string };
    };
    expect(registered.user.email).toBe("writer@example.com");
    expect(registered.user).not.toHaveProperty("passwordHash");

    const createResponse = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${registered.token}`,
      },
      body: JSON.stringify({ title: "Hello" }),
    });
    expect(createResponse.status).toBe(201);
    const post = (await createResponse.json()) as { id: string; title: string; user_id?: string };

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "writer@example.com", password: "password123" }),
    });
    expect(loginResponse.status).toBe(200);
    const loggedIn = (await loginResponse.json()) as { token: string; refreshToken: string };

    const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: loggedIn.refreshToken }),
    });
    expect(refreshResponse.status).toBe(200);
    const refreshed = (await refreshResponse.json()) as { token: string; refreshToken: string };

    const otherRegister = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "other@example.com", password: "password123" }),
    });
    const otherUser = (await otherRegister.json()) as { token: string };

    const forbiddenUpdate = await fetch(`${baseUrl}/api/posts/${post.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${otherUser.token}`,
      },
      body: JSON.stringify({ title: "Hacked" }),
    });
    expect(forbiddenUpdate.status).toBe(403);

    const ownerUpdate = await fetch(`${baseUrl}/api/posts/${post.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshed.token}`,
      },
      body: JSON.stringify({ title: "Updated" }),
    });
    expect(ownerUpdate.status).toBe(200);

    const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refreshed.refreshToken }),
    });
    expect(logoutResponse.status).toBe(204);

    const usersResponse = await fetch(`${baseUrl}/api/users`);
    expect(usersResponse.status).toBe(404);
  });

  test("returns conflict for duplicate registration", async () => {
    const context = createTestServer();
    db = context.db;
    server = context.server;
    const baseUrl = `http://127.0.0.1:${server.port}`;

    await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "dup@example.com", password: "password123" }),
    });

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "dup@example.com", password: "password123" }),
    });

    expect(response.status).toBe(409);
  });
});
