import { BakendClient } from "@bakend/client";

const baseUrl = process.env.BAKEND_URL ?? "http://localhost:8080";
const client = new BakendClient(baseUrl);

console.log(`Bakend SDK demo — ${baseUrl}\n`);

const events: string[] = [];
const off = client.realtime.subscribe("posts.*", (event) => {
  events.push(event.type);
  console.log(`[realtime] ${event.type}`, event.payload);
});

await new Promise((resolve) => setTimeout(resolve, 200));

const posts = client.collection("posts");
const created = await posts.create({ title: "Hello from SDK demo" });
console.log("[crud] created:", created);

await new Promise((resolve) => setTimeout(resolve, 200));

const user = await client.auth.register({
  email: `sdk-demo-${Date.now()}@example.com`,
  password: "password123",
});
console.log("[auth] registered:", user.email);

const file = new Blob(["sdk demo file"], { type: "text/plain" });
const uploaded = await client.storage.upload(file, {
  visibility: "public",
  filename: "demo.txt",
});
console.log("[storage] uploaded:", uploaded.id);

const downloaded = await client.storage.download(uploaded.id);
console.log("[storage] downloaded:", await downloaded.text());

await client.storage.delete(uploaded.id);
await posts.delete(created.id as string);

off();
client.realtime.disconnect();

console.log("\nDemo complete.");
console.log("Realtime events received:", events.length > 0 ? events.join(", ") : "(none — is the server running?)");
