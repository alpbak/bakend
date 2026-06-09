import type { ProjectContext } from "./project-context.ts";

export function functionsList(context: ProjectContext): void {
  const items = context.functions.list();

  if (items.length === 0) {
    console.log("No function triggers registered.");
    return;
  }

  for (const trigger of items) {
    console.log(
      `${trigger.collection}\t${trigger.type}\t${trigger.eventType}\t${trigger.filePath}`,
    );
  }
}
