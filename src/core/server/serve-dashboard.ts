import { existsSync, readFileSync, statSync } from "node:fs";
import { join, normalize } from "node:path";
import type { Logger } from "../logging/logger.ts";
import { DASHBOARD_ASSETS, DASHBOARD_EMBEDDED } from "./dashboard-assets.generated.ts";

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

function resolveDashboardRelativePath(pathname: string): string | null {
  if (!pathname.startsWith("/_/") && pathname !== "/_") {
    return null;
  }

  const relativePath = pathname === "/_" ? "" : pathname.slice(3);
  const safePath = normalize(relativePath).replace(/^(\.\.[/\\])+/, "");

  if (safePath === "." || safePath === "") {
    return "index.html";
  }

  if (safePath.includes("..")) {
    return null;
  }

  return safePath.replace(/\\/g, "/");
}

function resolveFilesystemDashboardFile(relativePath: string): string | null {
  const filePath = join(DASHBOARD_BUILD_DIR, relativePath);

  if (!filePath.startsWith(DASHBOARD_BUILD_DIR)) {
    return null;
  }

  return filePath;
}

function resolveEmbeddedDashboardPath(relativePath: string): string | null {
  if (DASHBOARD_ASSETS[relativePath]) {
    return DASHBOARD_ASSETS[relativePath]!;
  }

  return DASHBOARD_ASSETS["index.html"] ?? null;
}

function isDashboardAvailable(): boolean {
  if (DASHBOARD_EMBEDDED) {
    return Object.keys(DASHBOARD_ASSETS).length > 0;
  }

  return existsSync(DASHBOARD_BUILD_DIR);
}

function readDashboardFile(
  relativePath: string,
): { body: Buffer; mimePath: string } | null {
  if (DASHBOARD_EMBEDDED) {
    let embeddedPath = resolveEmbeddedDashboardPath(relativePath);
    if (!embeddedPath) {
      return null;
    }

    try {
      const body = readFileSync(embeddedPath);
      const mimePath = DASHBOARD_ASSETS[relativePath] ? relativePath : "index.html";
      return { body, mimePath };
    } catch {
      embeddedPath = DASHBOARD_ASSETS["index.html"] ?? null;
      if (!embeddedPath) {
        return null;
      }

      return {
        body: readFileSync(embeddedPath),
        mimePath: "index.html",
      };
    }
  }

  let filePath = resolveFilesystemDashboardFile(relativePath);
  if (!filePath) {
    return null;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(DASHBOARD_BUILD_DIR, "index.html");
  }

  if (!existsSync(filePath)) {
    return null;
  }

  return {
    body: readFileSync(filePath),
    mimePath: filePath,
  };
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

  if (!isDashboardAvailable()) {
    logger.warn("Dashboard build not found at dashboard/build — run `bun run dashboard:build`");
    return new Response("Dashboard not built", { status: 503 });
  }

  const relativePath = resolveDashboardRelativePath(url.pathname);
  if (!relativePath) {
    return new Response("Not found", { status: 404 });
  }

  const file = readDashboardFile(relativePath);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": getMimeType(file.mimePath),
  });

  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }

  return new Response(file.body, { status: 200, headers });
}
