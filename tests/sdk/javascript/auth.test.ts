import { afterEach, describe, expect, test } from "bun:test";
import { BakendClient, BakendError } from "@bakend/client";
import { createTestServer } from "../../helpers/test-server.ts";

describe("SDK auth", () => {
  let context: ReturnType<typeof createTestServer> | undefined;

  afterEach(() => {
    context?.realtime.shutdown();
    context?.server.stop();
    context?.db.close();
    context = undefined;
  });

  test("register, login, getMe, refresh, logout", async () => {
    context = createTestServer();
    const baseUrl = `http://127.0.0.1:${context.server.port}`;
    const client = new BakendClient(baseUrl);

    const user = await client.auth.register({
      email: "sdk@example.com",
      password: "password123",
    });
    expect(user.email).toBe("sdk@example.com");
    expect(client.auth.token).toBeTruthy();
    expect(client.auth.refreshToken).toBeTruthy();

    const me = await client.auth.getMe();
    expect(me.id).toBe(user.id);

    client.auth.clear();
    const loggedIn = await client.auth.login({
      email: "sdk@example.com",
      password: "password123",
    });
    expect(loggedIn.email).toBe("sdk@example.com");

    const refreshed = await client.auth.refresh();
    expect(refreshed.id).toBe(user.id);

    await client.auth.logout();
    expect(client.auth.token).toBeNull();
  });

  test("throws BakendError on invalid credentials", async () => {
    context = createTestServer();
    const client = new BakendClient(`http://127.0.0.1:${context.server.port}`);

    try {
      await client.auth.login({ email: "nope@example.com", password: "wrong" });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(BakendError);
      expect((error as BakendError).code).toBe("unauthorized");
    }
  });
});
