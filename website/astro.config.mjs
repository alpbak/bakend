import { defineConfig } from "astro/config";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { remarkRewriteLinks } from "./src/lib/remark-rewrite-links.ts";

const repo = "bakend";
const site = process.env.ASTRO_SITE ?? `https://alpbak.github.io/${repo}`;
const base = process.env.ASTRO_BASE ?? `/${repo}/`;

export default defineConfig({
  site,
  base,
  outDir: "dist",
  build: {
    format: "directory",
  },
  markdown: {
    remarkPlugins: [remarkGfm, [remarkRewriteLinks, { base }]],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: { className: ["heading-anchor"] },
        },
      ],
    ],
  },
});
