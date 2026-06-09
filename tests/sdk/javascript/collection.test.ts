import { afterEach, describe, expect, test } from "bun:test";
import { BakendClient, BakendError } from "@bakend/client";
import { createTestServer } from "../../helpers/test-server.ts";

describe("SDK collection", () => {
  let context: ReturnType<typeof createTestServer> | undefined;

  afterEach(() => {
    context?.realtime.shutdown();
    context?.server.stop();
    context?.db.close();
    context = undefined;
  });

  test("CRUD operations", async () => {
    context = createTestServer();
    context.collections.create({
      name: "posts",
      fields: [
        { name: "title", type: "string", required: true },
        { name: "content", type: "text" },
      ],
      permissions: {
        create: "public",
        read: "public",
        update: "public",
        delete: "public",
      },
    });

    const client = new BakendClient(`http://127.0.0.1:${context.server.port}`);
    const posts = client.collection("posts");

    const created = await posts.create({ title: "Hello", content: "World" });
    expect(created.title).toBe("Hello");
    expect(created.id).toMatch(/^rec_/);

    const fetched = await posts.get(created.id as string);
    expect(fetched.title).toBe("Hello");

    const list = await posts.list();
    expect(list.length).toBe(1);

    const updated = await posts.update(created.id as string, { title: "Updated" });
    expect(updated.title).toBe("Updated");

    await posts.delete(created.id as string);
    const afterDelete = await posts.list();
    expect(afterDelete.length).toBe(0);
  });

  test("throws BakendError on validation failure", async () => {
    context = createTestServer();
    context.collections.create({
      name: "posts",
      fields: [{ name: "title", type: "string", required: true }],
      permissions: { create: "public", read: "public", update: "public", delete: "public" },
    });

    const client = new BakendClient(`http://127.0.0.1:${context.server.port}`);
    const posts = client.collection("posts");

    try {
      await posts.create({});
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(BakendError);
      expect((error as BakendError).code).toBe("validation_error");
    }
  });
});
