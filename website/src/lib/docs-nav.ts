export interface NavItem {
  title: string;
  slug: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const docsNav: NavSection[] = [
  {
    title: "Overview",
    items: [{ title: "Documentation hub", slug: "" }],
  },
  {
    title: "User guide",
    items: [
      { title: "Installation", slug: "user-guide/installation" },
      { title: "Getting started", slug: "user-guide/getting-started" },
      { title: "SDK", slug: "user-guide/sdk" },
      { title: "Collections", slug: "user-guide/collections" },
      { title: "Authentication", slug: "user-guide/authentication" },
      { title: "Storage", slug: "user-guide/storage" },
      { title: "Realtime", slug: "user-guide/realtime" },
      { title: "Functions", slug: "user-guide/functions" },
      { title: "Jobs", slug: "user-guide/jobs" },
      { title: "Events", slug: "user-guide/events" },
      { title: "Dashboard", slug: "user-guide/dashboard" },
      { title: "Deployment", slug: "user-guide/deployment" },
    ],
  },
  {
    title: "API reference",
    items: [
      { title: "Overview", slug: "api" },
      { title: "REST API", slug: "api/rest-api" },
      { title: "Auth API", slug: "api/auth" },
      { title: "Storage API", slug: "api/storage" },
      { title: "WebSocket API", slug: "api/websocket-api" },
      { title: "Admin API", slug: "api/admin-api" },
    ],
  },
  {
    title: "SDKs",
    items: [
      { title: "Overview", slug: "sdk" },
      { title: "JavaScript / TypeScript", slug: "sdk/javascript" },
      { title: "Dart / Flutter", slug: "sdk/dart" },
    ],
  },
  {
    title: "LLM reference",
    items: [
      { title: "Overview", slug: "llm" },
      { title: "Product overview", slug: "llm/product-overview" },
      { title: "Architecture summary", slug: "llm/architecture-summary" },
      { title: "API summary", slug: "llm/api-summary" },
      { title: "CLI reference", slug: "llm/cli-reference" },
      { title: "Glossary", slug: "llm/glossary" },
      { title: "Common workflows", slug: "llm/common-workflows" },
      { title: "Collections", slug: "llm/collections" },
      { title: "Authentication", slug: "llm/authentication" },
      { title: "Storage", slug: "llm/storage" },
      { title: "Realtime", slug: "llm/realtime" },
      { title: "Functions", slug: "llm/functions" },
      { title: "Jobs", slug: "llm/jobs" },
      { title: "Event bus", slug: "llm/event-bus" },
      { title: "Dashboard", slug: "llm/dashboard" },
      { title: "SDK", slug: "llm/sdk" },
    ],
  },
  {
    title: "Architecture",
    items: [
      { title: "Architecture", slug: "architecture" },
      { title: "Tech stack", slug: "tech-stack" },
    ],
  },
  {
    title: "RFCs",
    items: [
      { title: "RFC index", slug: "rfcs" },
      { title: "RFC-0000 Event Bus", slug: "rfcs/rfc-0000-event-bus-and-execution-model" },
      { title: "RFC-0001 Core Architecture", slug: "rfcs/rfc-0001-core-architecture" },
      { title: "RFC-0002 Collections", slug: "rfcs/rfc-0002-collections-and-schema" },
      { title: "RFC-0003 Functions", slug: "rfcs/rfc-0003-functions-engine" },
      { title: "RFC-0004 Jobs", slug: "rfcs/rfc-0004-jobs-engine" },
      { title: "RFC-0005 Authentication", slug: "rfcs/rfc-0005-authentication-and-permissions" },
      { title: "RFC-0006 Realtime", slug: "rfcs/rfc-0006-realtime-engine" },
      { title: "RFC-0007 Storage", slug: "rfcs/rfc-0007-storage-system" },
      { title: "RFC-0008 CLI", slug: "rfcs/rfc-0008-cli-and-project-structure" },
      { title: "RFC-0009 SDK Design", slug: "rfcs/rfc-0009-sdk-design" },
      { title: "RFC-0010 Packaging", slug: "rfcs/rfc-0010-packaging-and-deployment" },
      { title: "RFC-0011 Admin Dashboard", slug: "rfcs/rfc-0011-admin-dashboard" },
      { title: "RFC-0018 Versioning", slug: "rfcs/rfc-0018-versioning-and-upgrade-policy" },
    ],
  },
];

export const tutorialsNav: NavItem[] = [
  { title: "Tutorial index", slug: "" },
  { title: "01 — Build a Todo API", slug: "01-todo-api" },
  { title: "02 — Add Realtime", slug: "02-realtime-app" },
  { title: "03 — Deploy to a VPS", slug: "03-deploy-vps" },
];

export function entryIdToSlug(id: string): string | null {
  if (id === "readme") return null;
  if (id.endsWith("/readme")) return id.slice(0, -"/readme".length);
  return id;
}

export function slugToEntryId(slug: string, entryIds: Iterable<string>): string {
  if (!slug) return "readme";
  const ids = new Set(entryIds);
  if (ids.has(slug)) return slug;
  const readme = `${slug}/readme`;
  if (ids.has(readme)) return readme;
  return slug;
}

export function flatDocsNav(): NavItem[] {
  return docsNav.flatMap((section) => section.items);
}

export function getDocsNeighbors(currentSlug: string): {
  prev: NavItem | null;
  next: NavItem | null;
} {
  const flat = flatDocsNav();
  const index = flat.findIndex((item) => item.slug === currentSlug);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index > 0 ? flat[index - 1]! : null,
    next: index < flat.length - 1 ? flat[index + 1]! : null,
  };
}

export function getTutorialNeighbors(currentSlug: string): {
  prev: NavItem | null;
  next: NavItem | null;
} {
  const index = tutorialsNav.findIndex((item) => item.slug === currentSlug);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index > 0 ? tutorialsNav[index - 1]! : null,
    next: index < tutorialsNav.length - 1 ? tutorialsNav[index + 1]! : null,
  };
}

function normalizeBase(base: string): string {
  return base.endsWith("/") ? base : `${base}/`;
}

export function docsHref(base: string, slug: string): string {
  const prefix = `${normalizeBase(base)}docs/`;
  return slug ? `${prefix}${slug}/` : prefix;
}

export function tutorialsHref(base: string, slug: string): string {
  const prefix = `${normalizeBase(base)}tutorials/`;
  return slug ? `${prefix}${slug}/` : prefix;
}
