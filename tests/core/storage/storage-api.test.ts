import { afterEach, describe, expect, test } from "bun:test";
import { createTestServer } from "../../helpers/test-server.ts";

describe("storage API", () => {
  let db: ReturnType<typeof createTestServer>["db"] | undefined;
  let server: ReturnType<typeof createTestServer>["server"] | undefined;

  afterEach(() => {
    server?.stop();
    server = undefined;
    db?.close();
    db = undefined;
  });

  async function registerUser(baseUrl: string, email: string) {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password123" }),
    });
    expect(response.status).toBe(201);
    return (await response.json()) as { token: string; user: { id: string } };
  }

  test("upload requires authentication", async () => {
    const context = createTestServer();
    db = context.db;
    server = context.server;
    const baseUrl = `http://127.0.0.1:${server.port}`;

    const form = new FormData();
    form.append("file", new File(["hello"], "hello.txt", { type: "text/plain" }));

    const response = await fetch(`${baseUrl}/api/storage/upload`, {
      method: "POST",
      body: form,
    });

    expect(response.status).toBe(401);
  });

  test("public file download without auth, protected requires owner", async () => {
    const context = createTestServer();
    db = context.db;
    server = context.server;
    const baseUrl = `http://127.0.0.1:${server.port}`;

    const owner = await registerUser(baseUrl, "owner@example.com");
    const other = await registerUser(baseUrl, "other@example.com");

    const publicForm = new FormData();
    publicForm.append("file", new File(["public content"], "public.txt", { type: "text/plain" }));
    publicForm.append("visibility", "public");

    const publicUpload = await fetch(`${baseUrl}/api/storage/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${owner.token}` },
      body: publicForm,
    });
    expect(publicUpload.status).toBe(201);
    const publicFile = (await publicUpload.json()) as { id: string };

    const publicDownload = await fetch(`${baseUrl}/api/storage/${publicFile.id}`);
    expect(publicDownload.status).toBe(200);
    expect(await publicDownload.text()).toBe("public content");

    const protectedForm = new FormData();
    protectedForm.append("file", new File(["secret"], "secret.txt", { type: "text/plain" }));
    protectedForm.append("visibility", "protected");

    const protectedUpload = await fetch(`${baseUrl}/api/storage/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${owner.token}` },
      body: protectedForm,
    });
    expect(protectedUpload.status).toBe(201);
    const protectedFile = (await protectedUpload.json()) as { id: string };

    const unauthProtected = await fetch(`${baseUrl}/api/storage/${protectedFile.id}`);
    expect(unauthProtected.status).toBe(401);

    const otherProtected = await fetch(`${baseUrl}/api/storage/${protectedFile.id}`, {
      headers: { Authorization: `Bearer ${other.token}` },
    });
    expect(otherProtected.status).toBe(403);

    const ownerProtected = await fetch(`${baseUrl}/api/storage/${protectedFile.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });
    expect(ownerProtected.status).toBe(200);
    expect(await ownerProtected.text()).toBe("secret");
  });

  test("delete as non-owner forbidden, owner succeeds", async () => {
    const context = createTestServer();
    db = context.db;
    server = context.server;
    const baseUrl = `http://127.0.0.1:${server.port}`;

    const owner = await registerUser(baseUrl, "owner@example.com");
    const other = await registerUser(baseUrl, "other@example.com");

    const form = new FormData();
    form.append("file", new File(["delete me"], "del.txt", { type: "text/plain" }));

    const upload = await fetch(`${baseUrl}/api/storage/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${owner.token}` },
      body: form,
    });
    const file = (await upload.json()) as { id: string };

    const otherDelete = await fetch(`${baseUrl}/api/storage/${file.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${other.token}` },
    });
    expect(otherDelete.status).toBe(403);

    const ownerDelete = await fetch(`${baseUrl}/api/storage/${file.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${owner.token}` },
    });
    expect(ownerDelete.status).toBe(204);

    const gone = await fetch(`${baseUrl}/api/storage/${file.id}`);
    expect(gone.status).toBe(404);
  });

  test("file field validates against storage", async () => {
    const context = createTestServer();
    db = context.db;
    server = context.server;
    const baseUrl = `http://127.0.0.1:${server.port}`;

    context.collections.create({
      name: "attachments",
      fields: [
        { name: "name", type: "string", required: true },
        { name: "file_id", type: "file", required: true },
      ],
    });

    const user = await registerUser(baseUrl, "user@example.com");

    const invalidCreate = await fetch(`${baseUrl}/api/attachments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({ name: "doc", file_id: "fil_missing" }),
    });
    expect(invalidCreate.status).toBe(400);

    const form = new FormData();
    form.append("file", new File(["data"], "data.bin", { type: "application/octet-stream" }));

    const upload = await fetch(`${baseUrl}/api/storage/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user.token}` },
      body: form,
    });
    const uploaded = (await upload.json()) as { id: string };

    const validCreate = await fetch(`${baseUrl}/api/attachments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({ name: "doc", file_id: uploaded.id }),
    });
    expect(validCreate.status).toBe(201);
  });
});
