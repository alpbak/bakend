import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createCollectionsEngine } from "../../../src/core/collections/create-collections-engine.ts";
import { createEventBus } from "../../../src/core/events/create-event-bus.ts";
import { createLogger } from "../../../src/core/logging/logger.ts";
import {
  canReceiveCollectionEvent,
  isCollectionEvent,
} from "../../../src/core/realtime/permissions.ts";
import { createTestStorage } from "../../helpers/test-storage.ts";
import { TEST_BOOTSTRAP_SQL } from "../../helpers/test-server.ts";

describe("realtime permissions", () => {
  test("identifies collection events", () => {
    expect(isCollectionEvent("posts.created")).toBe(true);
    expect(isCollectionEvent("auth.login")).toBe(false);
  });

  test("allows public collection events for anonymous clients", () => {
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

    const allowed = canReceiveCollectionEvent(collections, null, {
      id: "evt_1",
      type: "posts.created",
      timestamp: new Date().toISOString(),
      source: "collections",
      payload: { id: "rec_1", title: "Hello" },
    });

    expect(allowed).toBe(true);
    db.close();
  });

  test("denies owner-only collection events for non-owners", () => {
    const db = new Database(":memory:");
    db.run(TEST_BOOTSTRAP_SQL);
    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    const { storage } = createTestStorage(db, logger, eventBus, "/tmp");
    const collections = createCollectionsEngine({ db, logger, eventBus, storage });

    collections.create({
      name: "notes",
      fields: [
        { name: "title", type: "string", required: true },
        { name: "user_id", type: "string" },
      ],
      permissions: {
        create: "authenticated",
        read: "owner",
        update: "owner",
        delete: "owner",
      },
    });

    const otherUser = {
      user: {
        id: "user_other",
        email: "other@example.com",
        role: "authenticated" as const,
        createdAt: new Date().toISOString(),
      },
    };

    const denied = canReceiveCollectionEvent(collections, otherUser, {
      id: "evt_1",
      type: "notes.created",
      timestamp: new Date().toISOString(),
      source: "collections",
      payload: { id: "rec_1", title: "Secret", user_id: "user_owner" },
    });

    expect(denied).toBe(false);

    const owner = {
      user: {
        id: "user_owner",
        email: "owner@example.com",
        role: "authenticated" as const,
        createdAt: new Date().toISOString(),
      },
    };

    const allowed = canReceiveCollectionEvent(collections, owner, {
      id: "evt_2",
      type: "notes.created",
      timestamp: new Date().toISOString(),
      source: "collections",
      payload: { id: "rec_1", title: "Secret", user_id: "user_owner" },
    });

    expect(allowed).toBe(true);
    db.close();
  });
});
