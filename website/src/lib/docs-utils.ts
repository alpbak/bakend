import type { CollectionEntry } from "astro:content";

export function extractTitle(entry: CollectionEntry<"docs"> | CollectionEntry<"tutorials">): string {
  if (entry.data.title) return entry.data.title;
  const match = entry.body?.match(/^#\s+(.+)$/m);
  if (match?.[1]) return match[1].trim();
  return entry.id.replace(/.*\//, "").replace(/-/g, " ");
}
