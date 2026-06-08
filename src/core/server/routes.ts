import type { Logger } from "../logging/logger.ts";
import { VERSION } from "../../version.ts";

export interface HealthResponse {
  status: "ok";
  version: string;
}

export function handleRequest(request: Request, logger: Logger): Response {
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (url.pathname === "/" || url.pathname === "/health") {
    logger.debug(`${request.method} ${url.pathname}`);
    const body: HealthResponse = {
      status: "ok",
      version: VERSION,
    };
    return Response.json(body);
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}
