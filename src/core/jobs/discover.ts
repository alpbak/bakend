import { readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { parseCron } from "./cron.ts";
import type { JobHandler, RegisteredJob } from "./types.ts";
import { JobsError } from "./types.ts";

function listTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (error) {
    const message = String(error);
    if (message.includes("ENOENT")) {
      return files;
    }

    throw new JobsError(`Failed to read jobs directory ${dir}: ${message}`);
  }

  for (const entry of entries) {
    if (entry === ".bakend-cache") {
      continue;
    }

    const filePath = join(dir, entry);
    const stats = statSync(filePath);

    if (stats.isDirectory()) {
      files.push(...listTypeScriptFiles(filePath));
      continue;
    }

    if (stats.isFile() && entry.endsWith(".ts")) {
      files.push(filePath);
    }
  }

  return files.sort();
}

function jobNameFromPath(filePath: string): string {
  const fileName = basename(filePath);
  return fileName.replace(/\.ts$/, "");
}

export async function discoverJobs(
  jobsDir: string,
  reloadToken: string,
): Promise<RegisteredJob[]> {
  const files = listTypeScriptFiles(jobsDir);
  const jobs: RegisteredJob[] = [];

  for (const filePath of files) {
    const importPath = `${filePath}?reload=${reloadToken}`;

    let module: {
      schedule?: unknown;
      default?: unknown;
    };

    try {
      module = await import(importPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new JobsError(`Failed to load job ${filePath}: ${message}`);
    }

    if (typeof module.schedule !== "string" || module.schedule.trim() === "") {
      throw new JobsError(`Job ${filePath} must export a non-empty schedule string`);
    }

    if (typeof module.default !== "function") {
      throw new JobsError(`Job ${filePath} must export a default handler function`);
    }

    parseCron(module.schedule);

    jobs.push({
      name: jobNameFromPath(filePath),
      filePath,
      schedule: module.schedule.trim(),
      handler: module.default as JobHandler,
    });
  }

  return jobs;
}
