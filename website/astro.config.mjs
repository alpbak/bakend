import { defineConfig } from "astro/config";

const repo = "bakend";
const site = process.env.ASTRO_SITE ?? `https://alpbak.github.io/${repo}`;

export default defineConfig({
  site,
  base: process.env.ASTRO_BASE ?? `/${repo}`,
  outDir: "dist",
});
