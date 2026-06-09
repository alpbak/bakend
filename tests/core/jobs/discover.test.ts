import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverJobs } from "../../../src/core/jobs/discover.ts";
import { JobsError } from "../../../src/core/jobs/types.ts";

describe("discoverJobs", () => {
  let tempDir = "";

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  test("returns empty array when jobs directory is missing", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-jobs-discover-"));
    const jobsDir = join(tempDir, "jobs");

    const jobs = await discoverJobs(jobsDir, "1");

    expect(jobs).toEqual([]);
  });

  test("discovers nested TypeScript files and loads jobs", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-jobs-discover-"));
    const jobsDir = join(tempDir, "jobs");
    const nestedDir = join(jobsDir, "maintenance");
    mkdirSync(nestedDir, { recursive: true });

    writeFileSync(
      join(nestedDir, "cleanup.ts"),
      `export const schedule = "0 3 * * *";

export default async () => {};
`,
    );

    const jobs = await discoverJobs(jobsDir, "1");

    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.name).toBe("cleanup");
    expect(jobs[0]?.schedule).toBe("0 3 * * *");
    expect(jobs[0]?.filePath).toEndWith("jobs/maintenance/cleanup.ts");
  });

  test("rejects jobs without schedule export", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-jobs-discover-"));
    const jobsDir = join(tempDir, "jobs");
    mkdirSync(jobsDir, { recursive: true });

    writeFileSync(
      join(jobsDir, "broken.ts"),
      `export default async () => {};
`,
    );

    await expect(discoverJobs(jobsDir, "1")).rejects.toThrow(JobsError);
  });

  test("rejects jobs with invalid cron expression", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bakend-jobs-discover-"));
    const jobsDir = join(tempDir, "jobs");
    mkdirSync(jobsDir, { recursive: true });

    writeFileSync(
      join(jobsDir, "broken.ts"),
      `export const schedule = "invalid";

export default async () => {};
`,
    );

    await expect(discoverJobs(jobsDir, "1")).rejects.toThrow(JobsError);
  });
});
