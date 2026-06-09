import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createCollectionsEngine } from "../../../src/core/collections/create-collections-engine.ts";
import { createEventBus } from "../../../src/core/events/create-event-bus.ts";
import { createLogger } from "../../../src/core/logging/logger.ts";
import { createRealtimeEngine } from "../../../src/core/realtime/create-realtime-engine.ts";
import type { RealtimeConnectionData, RealtimeSocket } from "../../../src/core/realtime/types.ts";
import { createTestStorage } from "../../helpers/test-storage.ts";
import { TEST_BOOTSTRAP_SQL } from "../../helpers/test-server.ts";

function createMockSocket(authContext: RealtimeConnectionData["authContext"] = null) {
  const sent: string[] = [];
  const data: RealtimeConnectionData = {
    clientId: "",
    authContext,
    subscriptions: new Set(),
  };

  const ws = {
    data,
    send(message: string) {
      sent.push(message);
    },
    close() {},
  } as unknown as RealtimeSocket;

  return { ws, sent, data };
}

describe("createRealtimeEngine", () => {
  test("handles subscribe, fan-out, ping, and unsubscribe", () => {
    const db = new Database(":memory:");
    db.run(TEST_BOOTSTRAP_SQL);
    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    const { storage } = createTestStorage(db, logger, eventBus, "/tmp");
    const collections = createCollectionsEngine({ db, logger, eventBus, storage });
    collections.create({
      name: "posts",
      fields: [{ name: "title", type: "string", required: true }],
    });
    const realtime = createRealtimeEngine({ eventBus, collections, logger });

    const { ws, sent } = createMockSocket();
    realtime.handleOpen(ws);

    expect(JSON.parse(sent[0]!)).toEqual({
      type: "connected",
      clientId: expect.stringMatching(/^rt_/),
    });

    realtime.handleMessage(ws, JSON.stringify({ action: "subscribe", channel: "posts.created" }));
    expect(JSON.parse(sent.at(-1)!)).toEqual({
      type: "subscribed",
      channel: "posts.created",
    });

    eventBus.emit("posts.created", {
      source: "collections",
      payload: { id: "rec_1", title: "Hello" },
    });

    const eventFrame = JSON.parse(sent.at(-1)!);
    expect(eventFrame.type).toBe("event");
    expect(eventFrame.event.type).toBe("posts.created");

    realtime.handleMessage(ws, JSON.stringify({ action: "ping" }));
    expect(JSON.parse(sent.at(-1)!)).toEqual({ type: "pong" });

    realtime.handleMessage(ws, JSON.stringify({ action: "unsubscribe", channel: "posts.created" }));
    sent.length = 0;

    eventBus.emit("posts.created", { source: "collections", payload: { id: "rec_2" } });
    expect(sent).toHaveLength(0);

    realtime.shutdown();
    db.close();
  });

  test("returns error for invalid JSON", () => {
    const db = new Database(":memory:");
    db.run(TEST_BOOTSTRAP_SQL);
    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    const { storage } = createTestStorage(db, logger, eventBus, "/tmp");
    const collections = createCollectionsEngine({ db, logger, eventBus, storage });
    const realtime = createRealtimeEngine({ eventBus, collections, logger });

    const { ws, sent } = createMockSocket();
    realtime.handleOpen(ws);
    sent.length = 0;

    realtime.handleMessage(ws, "not-json");
    expect(JSON.parse(sent[0]!)).toEqual({
      type: "error",
      code: "invalid_json",
      message: "Invalid JSON message",
    });

    realtime.shutdown();
    db.close();
  });
});
