import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverFunctions } from "../../../src/core/functions/discover.ts";

describe("discoverFunctions", () => {
  let tempDir = "";

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  test("returns empty array when functions directory is missing", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-discover-"));
    const functionsDir = join(tempDir, "functions");

    const triggers = await discoverFunctions(functionsDir, "1");

    expect(triggers).toEqual([]);
  });

  test("discovers nested TypeScript files and loads triggers", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-discover-"));
    const functionsDir = join(tempDir, "functions");
    const postsDir = join(functionsDir, "posts");
    mkdirSync(postsDir, { recursive: true });

    writeFileSync(
      join(postsDir, "handler.ts"),
      `import { onCreate } from "bakend/functions";

onCreate("posts", async () => {});
`,
    );

    const triggers = await discoverFunctions(functionsDir, "1");

    expect(triggers).toHaveLength(1);
    expect(triggers[0]?.collection).toBe("posts");
    expect(triggers[0]?.type).toBe("create");
    expect(triggers[0]?.eventType).toBe("posts.created");
    expect(triggers[0]?.filePath).toEndWith("functions/posts/handler.ts");
  });
});
