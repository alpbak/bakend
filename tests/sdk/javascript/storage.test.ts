import { afterEach, describe, expect, test } from "bun:test";
import { BakendClient } from "@bakend/client";
import { createTestServer } from "../../helpers/test-server.ts";

describe("SDK storage", () => {
  let context: ReturnType<typeof createTestServer> | undefined;

  afterEach(() => {
    context?.realtime.shutdown();
    context?.server.stop();
    context?.db.close();
    context = undefined;
  });

  test("upload, download, delete", async () => {
    context = createTestServer();
    const baseUrl = `http://127.0.0.1:${context.server.port}`;
    const client = new BakendClient(baseUrl);

    await client.auth.register({
      email: "storage@example.com",
      password: "password123",
    });

    const content = "hello sdk storage";
    const file = new Blob([content], { type: "text/plain" });
    const metadata = await client.storage.upload(file, {
      visibility: "public",
      filename: "test.txt",
    });

    expect(metadata.id).toMatch(/^fil_/);
    expect(metadata.filename).toBe("test.txt");
    expect(metadata.visibility).toBe("public");

    const url = client.storage.getDownloadUrl(metadata.id);
    expect(url).toBe(`${baseUrl}/api/storage/${metadata.id}`);

    const blob = await client.storage.download(metadata.id);
    expect(await blob.text()).toBe(content);

    await client.storage.delete(metadata.id);

    const response = await fetch(url);
    expect(response.status).toBe(404);
  });
});
