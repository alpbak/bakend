import type { FunctionsEngine } from "../../../functions/types.ts";
import { jsonOk } from "../../responses.ts";

export interface AdminFunctionsContext {
  functions: FunctionsEngine;
}

export function handleAdminListFunctions(context: AdminFunctionsContext): Response {
  const items = context.functions.list().map((trigger) => ({
    collection: trigger.collection,
    type: trigger.type,
    eventType: trigger.eventType,
    filePath: trigger.filePath,
  }));

  return jsonOk({ items });
}
