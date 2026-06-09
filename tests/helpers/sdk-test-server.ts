import { createTestServer } from "./test-server.ts";

const context = createTestServer();

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

process.stdout.write(
  JSON.stringify({
    port: context.server.port,
    baseUrl: `http://127.0.0.1:${context.server.port}`,
  }) + "\n",
);

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  context.realtime.shutdown();
  context.server.stop();
  context.db.close();
  process.exit(0);
}

// Keep process alive for Dart integration tests.
setInterval(() => {}, 60_000);
