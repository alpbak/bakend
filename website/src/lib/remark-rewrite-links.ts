import path from "node:path";
import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import type { VFile } from "vfile";

const GITHUB_REPO = "https://github.com/alpbak/bakend/tree/main";

interface RewriteOptions {
  base: string;
}

function normalizeBase(base: string): string {
  return base.endsWith("/") ? base : `${base}/`;
}

function findRoot(filePath: string, segment: string): string | null {
  const parts = filePath.split(path.sep);
  const idx = parts.lastIndexOf(segment);
  if (idx < 0) return null;
  return parts.slice(0, idx + 1).join(path.sep);
}

function findRepoRoot(filePath: string): string | null {
  const docsRoot = findRoot(filePath, "docs");
  if (docsRoot) return path.dirname(docsRoot);
  const tutorialsRoot = findRoot(filePath, "tutorials");
  if (tutorialsRoot) return path.dirname(tutorialsRoot);
  return null;
}

function toSlug(relativePath: string): string {
  let slug = relativePath.replace(/\.md$/i, "");
  if (slug.toLowerCase().endsWith("/readme")) {
    slug = slug.slice(0, -"/readme".length);
  } else if (slug.toLowerCase() === "readme") {
    slug = "";
  }
  return slug.toLowerCase();
}

function toSiteUrl(base: string, section: "docs" | "tutorials", slug: string, hash: string): string {
  const pathPart = slug ? `${slug}/` : "";
  return `${normalizeBase(base)}${section}/${pathPart}${hash}`;
}

function toGithubUrl(relativePath: string, hash: string): string {
  const clean = relativePath.replace(/^\//, "");
  return `${GITHUB_REPO}/${clean}${hash}`;
}

function rewriteUrl(currentFile: string, url: string, base: string): string {
  const hashIndex = url.indexOf("#");
  const pathPart = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : "";

  if (!pathPart || pathPart.startsWith("http") || pathPart.startsWith("mailto:")) {
    return url;
  }

  const repoRoot = findRepoRoot(currentFile);
  if (!repoRoot) return url;

  const docsRoot = path.join(repoRoot, "docs");
  const tutorialsRoot = path.join(repoRoot, "tutorials");
  const fileDir = path.dirname(currentFile);
  const absolute = path.normalize(path.resolve(fileDir, pathPart));

  const docsRelative = path.relative(docsRoot, absolute).replace(/\\/g, "/");
  if (!docsRelative.startsWith("..") && !path.isAbsolute(docsRelative)) {
    return toSiteUrl(base, "docs", toSlug(docsRelative), hash);
  }

  const tutorialsRelative = path.relative(tutorialsRoot, absolute).replace(/\\/g, "/");
  if (!tutorialsRelative.startsWith("..") && !path.isAbsolute(tutorialsRelative)) {
    return toSiteUrl(base, "tutorials", toSlug(tutorialsRelative), hash);
  }

  const repoRelative = path.relative(repoRoot, absolute).replace(/\\/g, "/");
  if (!repoRelative.startsWith("..")) {
    return toGithubUrl(repoRelative, hash);
  }

  return url;
}

export function remarkRewriteLinks(options: RewriteOptions) {
  return (tree: Root, file: VFile) => {
    const currentFile = file.path ?? file.history?.[0] ?? "";
    if (!currentFile) return;

    visit(tree, "link", (node) => {
      if (typeof node.url === "string") {
        node.url = rewriteUrl(currentFile, node.url, options.base);
      }
    });
  };
}
