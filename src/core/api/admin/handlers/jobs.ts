import type { JobsEngine } from "../../../jobs/types.ts";
import { jsonOk, notFoundResponse } from "../../responses.ts";

export interface AdminJobsContext {
  jobs: JobsEngine;
}

export function handleAdminListJobs(context: AdminJobsContext): Response {
  const items = context.jobs.list().map((job) => ({
    name: job.name,
    schedule: job.schedule,
    filePath: job.filePath,
  }));

  return jsonOk({ items });
}

export function handleAdminJobRuns(context: AdminJobsContext, name: string): Response {
  const job = context.jobs.list().find((entry) => entry.name === name);
  if (!job) {
    return notFoundResponse(`Job "${name}" does not exist`);
  }

  return jsonOk({ items: context.jobs.getRuns(name) });
}
