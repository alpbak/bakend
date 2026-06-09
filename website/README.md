# Bakend Website

Static marketing site built with [Astro](https://astro.build).

## Development

```bash
cd website
bun install
bun run dev
```

## Build

```bash
bun run build
```

Output is written to `website/dist/`.

## Deployment

Deployed to GitHub Pages via `.github/workflows/website.yml`.

Default URL: `https://alpbak.github.io/bakend/`

Override base path for local preview:

```bash
ASTRO_BASE=/ bun run dev
```
