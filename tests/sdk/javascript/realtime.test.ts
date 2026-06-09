import { afterEach, describe, expect, test } from "bun:test";
import { BakendClient } from "@bakend/client";
import type { BakendEvent } from "@bakend/client";
import { createTestServer } from "../../helpers/test-server.ts";

function waitForEvent(events: BakendEvent[], type: string, timeoutMs = 3000): Promise<BakendEvent> {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    const check = () => {
      const found = events.find((event) => event.type === type);
      if (found) {
        resolve(found);
        return;
      }

      if (Date.now() - started >= timeoutMs) {
        reject(new Error(`Timed out waiting for event ${type}`));
        return;
      }

      setTimeout(check, 10);
    };

    check();
  });
}

describe("SDK realtime", () => {
  let context: ReturnType<typeof createTestServer> | undefined;

  afterEach(() => {
    context?.realtime.shutdown();
    context?.server.stop();
    context?.db.close();
    context = undefined;
  });

  test("receives collection events via subscribe", async () => {
    context = createTestServer();
    context.collections.create({
      name: "posts",
      fields: [{ name: "title", type: "string", required: true }],
      permissions: { create: "public", read: "public", update: "public", delete: "public" },
    });

    const client = new BakendClient(`http://127.0.0.1:${context.server.port}`);
    const events: BakendEvent[] = [];

    const off = client.realtime.subscribe("posts.created", (event) => {
      events.push(event);
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    await client.collection("posts").create({ title: "Realtime SDK" });

    const event = await waitForEvent(events, "posts.created");
    expect((event.payload as { title: string }).title).toBe("Realtime SDK");

    off();
    client.realtime.disconnect();
  });
});
