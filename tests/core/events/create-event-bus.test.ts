import { describe, expect, test } from "bun:test";
import { createEventBus } from "../../../src/core/events/create-event-bus.ts";
import type { BakendEvent } from "../../../src/core/events/types.ts";
import { createLogger } from "../../../src/core/logging/logger.ts";

describe("createEventBus", () => {
  test("emit invokes handler with correct event shape", () => {
    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    let received: BakendEvent | undefined;

    eventBus.on("users.created", (event) => {
      received = event;
    });

    eventBus.emit("users.created", {
      source: "collections",
      payload: { id: "user_1", email: "john@example.com" },
    });

    expect(received).toBeDefined();
    expect(received!.type).toBe("users.created");
    expect(received!.id).toMatch(/^evt_/);
    expect(received!.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(received!.source).toBe("collections");
    expect(received!.payload).toEqual({ id: "user_1", email: "john@example.com" });
  });

  test("emit invokes all handlers for a type", () => {
    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    const calls: number[] = [];

    eventBus.on("users.created", () => {
      calls.push(1);
    });
    eventBus.on("users.created", () => {
      calls.push(2);
    });

    eventBus.emit("users.created");

    expect(calls).toEqual([1, 2]);
  });

  test("handlers are isolated by event type", () => {
    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    let usersCalled = false;
    let postsCalled = false;

    eventBus.on("users.created", () => {
      usersCalled = true;
    });
    eventBus.on("posts.created", () => {
      postsCalled = true;
    });

    eventBus.emit("posts.created");

    expect(usersCalled).toBe(false);
    expect(postsCalled).toBe(true);
  });

  test("async handlers run after flush", async () => {
    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    let called = false;

    eventBus.on("users.created", async () => {
      await Promise.resolve();
      called = true;
    });

    eventBus.emit("users.created");
    expect(called).toBe(false);

    await eventBus.flush();
    expect(called).toBe(true);
  });

  test("handler errors do not propagate from emit", () => {
    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    let secondCalled = false;

    eventBus.on("users.created", () => {
      throw new Error("handler failed");
    });
    eventBus.on("users.created", () => {
      secondCalled = true;
    });

    expect(() => eventBus.emit("users.created")).not.toThrow();
    expect(secondCalled).toBe(true);
  });

  test("unsubscribe prevents further handler calls", () => {
    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    let callCount = 0;

    const unsubscribe = eventBus.on("users.created", () => {
      callCount += 1;
    });

    eventBus.emit("users.created");
    unsubscribe();
    eventBus.emit("users.created");

    expect(callCount).toBe(1);
  });

  test("onAny receives every emitted event", () => {
    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    const received: string[] = [];

    eventBus.onAny((event) => {
      received.push(event.type);
    });

    eventBus.emit("users.created");
    eventBus.emit("posts.updated");

    expect(received).toEqual(["users.created", "posts.updated"]);
  });

  test("onAny runs before type-specific handlers", () => {
    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    const order: string[] = [];

    eventBus.onAny(() => {
      order.push("any");
    });
    eventBus.on("users.created", () => {
      order.push("typed");
    });

    eventBus.emit("users.created");

    expect(order).toEqual(["any", "typed"]);
  });

  test("onAny unsubscribe stops delivery", () => {
    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    let callCount = 0;

    const unsubscribe = eventBus.onAny(() => {
      callCount += 1;
    });

    eventBus.emit("users.created");
    unsubscribe();
    eventBus.emit("users.created");

    expect(callCount).toBe(1);
  });

  test("defaults source to system when omitted", () => {
    const logger = createLogger("ERROR");
    const eventBus = createEventBus(logger);
    let received: BakendEvent | undefined;

    eventBus.on("users.created", (event) => {
      received = event;
    });

    eventBus.emit("users.created");

    expect(received!.source).toBe("system");
    expect(received!.payload).toBeUndefined();
  });
});
