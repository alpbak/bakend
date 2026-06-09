# Scripts

Build, packaging, and deployment scripts.

| Script | Purpose |
|---|---|
| `build.ts` | Build dashboard, generate asset manifest, compile `dist/bak` |
| `install.sh` | Download and install release binary (see RFC-0010) |

```bash
bun run build
bun run build:linux-x64
```
