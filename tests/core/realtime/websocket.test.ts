import { afterEach, describe, expect, test } from "bun:test";
import { createTestServer } from "../../helpers/test-server.ts";

function waitForMessage<T>(
  messages: unknown[],
  predicate: (message: T) => boolean,
  timeoutMs = 3000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    const check = () => {
      const found = messages.find((message) => predicate(message as T));
      if (found) {
        resolve(found as T);
        return;
      }

      if (Date.now() - started >= timeoutMs) {
        reject(new Error("Timed out waiting for WebSocket message"));
        return;
      }

      setTimeout(check, 10);
    };

    check();
  });
}

describe("realtime websocket", () => {
  let context: ReturnType<typeof createTestServer> | undefined;

  afterEach(() => {
    context?.realtime.shutdown();
    context?.server.stop();
    context?.db.close();
    context = undefined;
  });

  test("delivers collection events to subscribed clients", async () => {
    context = createTestServer();
    context.collections.create({
      name: "posts",
      fields: [{ name: "title", type: "string", required: true }],
    });

    const messages: unknown[] = [];
    const ws = new WebSocket(`ws://127.0.0.1:${context.server.port}/api/realtime`);

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error("WebSocket connection failed"));
    });

    ws.onmessage = (event) => {
      messages.push(JSON.parse(String(event.data)));
    };

    await waitForMessage(messages, (message) => (message as { type: string }).type === "connected");

    ws.send(JSON.stringify({ action: "subscribe", channel: "posts.created" }));
    await waitForMessage(messages, (message) => (message as { type: string }).type === "subscribed");

    const createResponse = await fetch(`http://127.0.0.1:${context.server.port}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Realtime" }),
    });
    expect(createResponse.status).toBe(201);

    const eventMessage = await waitForMessage(
      messages,
      (message) => (message as { type: string }).type === "event",
    );

    expect((eventMessage as { event: { type: string } }).event.type).toBe("posts.created");
    ws.close();
  });

  test("delivers auth events to subscribers", async () => {
    context = createTestServer();
    const messages: unknown[] = [];
    const ws = new WebSocket(`ws://127.0.0.1:${context.server.port}/api/realtime`);

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error("WebSocket connection failed"));
    });

    ws.onmessage = (event) => {
      messages.push(JSON.parse(String(event.data)));
    };

    await waitForMessage(messages, (message) => (message as { type: string }).type === "connected");

    ws.send(JSON.stringify({ action: "subscribe", channel: "auth.register" }));

    await fetch(`http://127.0.0.1:${context.server.port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "realtime@example.com", password: "password123" }),
    });

    const eventMessage = await waitForMessage(
      messages,
      (message) => (message as { type: string }).type === "event",
    );

    expect((eventMessage as { event: { type: string } }).event.type).toBe("auth.register");
    ws.close();
  });

  test("rejects non-GET upgrade requests", async () => {
    context = createTestServer();

    const response = await fetch(`http://127.0.0.1:${context.server.port}/api/realtime`, {
      method: "POST",
    });

    expect(response.status).toBe(405);
  });
});
