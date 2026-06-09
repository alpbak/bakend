import { existsSync, readFileSync, statSync } from "node:fs";
import { join, normalize } from "node:path";
import type { Logger } from "../logging/logger.ts";

const DASHBOARD_BUILD_DIR = join(import.meta.dir, "../../../dashboard/build");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function getMimeType(filePath: string): string {
  const extension = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  return MIME_TYPES[extension] ?? "application/octet-stream";
}

function resolveDashboardFile(pathname: string): string | null {
  if (!pathname.startsWith("/_/") && pathname !== "/_") {
    return null;
  }

  const relativePath = pathname === "/_" ? "" : pathname.slice(3);
  const safePath = normalize(relativePath).replace(/^(\.\.[/\\])+/, "");

  if (safePath === "." || safePath === "") {
    return join(DASHBOARD_BUILD_DIR, "index.html");
  }

  const filePath = join(DASHBOARD_BUILD_DIR, safePath);

  if (!filePath.startsWith(DASHBOARD_BUILD_DIR)) {
    return null;
  }

  return filePath;
}

export function handleDashboardRequest(
  request: Request,
  enabled: boolean,
  logger: Logger,
): Response | null {
  if (!enabled) {
    return null;
  }

  const url = new URL(request.url);
  if (!url.pathname.startsWith("/_/") && url.pathname !== "/_") {
    return null;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!existsSync(DASHBOARD_BUILD_DIR)) {
    logger.warn("Dashboard build not found at dashboard/build — run `bun run dashboard:build`");
    return new Response("Dashboard not built", { status: 503 });
  }

  const filePath = resolveDashboardFile(url.pathname);
  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  let resolvedPath = filePath;

  if (!existsSync(resolvedPath) || statSync(resolvedPath).isDirectory()) {
    resolvedPath = join(DASHBOARD_BUILD_DIR, "index.html");
  }

  if (!existsSync(resolvedPath)) {
    return new Response("Not found", { status: 404 });
  }

  const body = readFileSync(resolvedPath);
  const headers = new Headers({
    "Content-Type": getMimeType(resolvedPath),
  });

  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }

  return new Response(body, { status: 200, headers });
}
