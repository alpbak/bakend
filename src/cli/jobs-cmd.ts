import type { ProjectContext } from "./project-context.ts";

export function jobsList(context: ProjectContext): void {
  const items = context.jobs.list();

  if (items.length === 0) {
    console.log("No jobs registered.");
    return;
  }

  for (const job of items) {
    console.log(`${job.name}\t${job.schedule}\t${job.filePath}`);
  }
}

export function jobsRuns(context: ProjectContext, name: string): void {
  const job = context.jobs.list().find((entry) => entry.name === name);
  if (!job) {
    throw new Error(`Job "${name}" does not exist`);
  }

  const runs = context.jobs.getRuns(name);
  if (runs.length === 0) {
    console.log(`No runs recorded for job "${name}".`);
    return;
  }

  for (const run of runs) {
    const errorSuffix = run.error ? `\t${run.error}` : "";
    console.log(
      `${run.runId}\t${run.status}\tattempt=${run.attempt}\t${run.startedAt}\t${run.endedAt ?? ""}${errorSuffix}`,
    );
  }
}
