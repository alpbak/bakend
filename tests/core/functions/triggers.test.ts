import { describe, expect, test } from "bun:test";
import { takePendingTriggers, withTriggerRegistry } from "../../../src/core/functions/trigger-registry.ts";
import { onCreate, onDelete, onLogin, onRegister, onUpdate } from "../../../src/core/functions/triggers.ts";

describe("function triggers", () => {
  test("onCreate registers posts.created", async () => {
    const handler = async () => {};

    await withTriggerRegistry(async () => {
      onCreate("posts", handler);
      expect(takePendingTriggers("/functions/posts/handler.ts")).toEqual([
        {
          collection: "posts",
          type: "create",
          eventType: "posts.created",
          filePath: "/functions/posts/handler.ts",
          handler,
        },
      ]);
    });
  });

  test("onUpdate registers posts.updated", async () => {
    const handler = async () => {};

    await withTriggerRegistry(async () => {
      onUpdate("posts", handler);
      expect(takePendingTriggers("/functions/posts/handler.ts")[0]?.eventType).toBe("posts.updated");
    });
  });

  test("onDelete registers posts.deleted", async () => {
    const handler = async () => {};

    await withTriggerRegistry(async () => {
      onDelete("posts", handler);
      expect(takePendingTriggers("/functions/posts/handler.ts")[0]?.eventType).toBe("posts.deleted");
    });
  });

  test("onLogin registers auth.login", async () => {
    const handler = async () => {};

    await withTriggerRegistry(async () => {
      onLogin("users", handler);
      expect(takePendingTriggers("/functions/users/login.ts")[0]?.eventType).toBe("auth.login");
    });
  });

  test("onRegister registers auth.register", async () => {
    const handler = async () => {};

    await withTriggerRegistry(async () => {
      onRegister("users", handler);
      expect(takePendingTriggers("/functions/users/register.ts")[0]?.eventType).toBe("auth.register");
    });
  });
});
