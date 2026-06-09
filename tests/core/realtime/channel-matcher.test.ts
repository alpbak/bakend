import { describe, expect, test } from "bun:test";
import { isValidChannel, matchesChannel } from "../../../src/core/realtime/channel-matcher.ts";

describe("channel-matcher", () => {
  test("matches exact channel names", () => {
    expect(matchesChannel("posts.created", "posts.created")).toBe(true);
    expect(matchesChannel("posts.created", "posts.updated")).toBe(false);
  });

  test("matches wildcard subscriptions", () => {
    expect(matchesChannel("posts.*", "posts.created")).toBe(true);
    expect(matchesChannel("posts.*", "posts.updated")).toBe(true);
    expect(matchesChannel("posts.*", "posts.deleted")).toBe(true);
    expect(matchesChannel("posts.*", "comments.created")).toBe(false);
  });

  test("validates channel names", () => {
    expect(isValidChannel("posts.created")).toBe(true);
    expect(isValidChannel("posts.*")).toBe(true);
    expect(isValidChannel("auth.login")).toBe(true);
    expect(isValidChannel("system.collection.created")).toBe(true);
    expect(isValidChannel("")).toBe(false);
    expect(isValidChannel("bad channel")).toBe(false);
  });
});
