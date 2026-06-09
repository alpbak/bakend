# Scripts

Build, packaging, and deployment scripts.

| Script | Purpose |
|---|---|
| `build.ts` | Build dashboard, generate asset manifest, compile `dist/bak` |
| `install.sh` | Download and install release binary (see RFC-0010) |

Website build lives in `website/` (Astro). See `website/README.md`.

```bash
bun run build
bun run build:linux-x64
```
