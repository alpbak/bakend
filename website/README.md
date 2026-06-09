# Bakend Website

Static site built with [Astro](https://astro.build), deployed to GitHub Pages.

## What it includes

- Marketing pages (home, examples)
- **Hosted documentation** — renders `docs/` and `tutorials/` from the repo root at build time
- Light and dark theme

Documentation is loaded via Astro content collections (`src/content.config.ts`) with glob loaders pointing at `../docs` and `../tutorials`. Markdown links are rewritten to on-site URLs during build.

## Development

```bash
cd website
bun install
bun run dev
```

Open [http://localhost:4321/bakend/](http://localhost:4321/bakend/) (default base path).

Override base path for local preview at site root:

```bash
ASTRO_BASE=/ bun run dev
```

## Build

```bash
bun run build
```

Output is written to `website/dist/`.

## Deployment

Deployed to GitHub Pages via `.github/workflows/website.yml`.

The workflow runs when changes land on `main` in:

- `website/**`
- `docs/**`
- `tutorials/**`

Default URL: `https://alpbak.github.io/bakend/`

Docs hub: `https://alpbak.github.io/bakend/docs/`
