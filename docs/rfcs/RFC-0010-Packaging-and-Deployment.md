# RFC-0010 Packaging and Deployment

Defines executable packaging, Docker support, systemd integration, upgrades, and deployment workflows.

## Purpose

Bakend must deploy on VPS environments without requiring Bun, Node.js, or source code on the target host. The platform ships as a single compiled binary with an embedded admin dashboard.

## Goals

- Single executable (`bak`) containing runtime + embedded dashboard
- Cross-platform release artifacts for common VPS and developer targets
- Docker image for containerized deployment
- systemd unit file for Linux service management
- Documented upgrade procedure with automatic internal schema migration

## Non-Goals (Milestone 12)

- `bak init` project scaffolding (RFC-0008)
- Automated backup/restore (RFC-0014)
- Windows builds (deferred; Linux-first for VPS)
- Embedding user `functions/`, `jobs/`, or `collections/` into the binary
- Hosted `install.sh` at `bakend.dev` (script provided; hosting deferred)

## Deployment Model

PocketBase-style separation:

| Component | Location |
|---|---|
| Platform binary | `/opt/bakend/bak` or `/usr/local/bin/bak` |
| Project config | `bakend.json` beside project data |
| Collections | `collections/*.json` |
| Functions | `functions/**/*.ts` |
| Jobs | `jobs/**/*.ts` |
| Database | Path from `bakend.json` (default `./bakend.db`) |
| Storage | Path from `bakend.json` (default `./storage`) |
| Admin dashboard | Embedded in binary, served at `/_` |

The binary resolves project paths relative to `dirname(bakend.json)`.

## Build Targets

Primary release targets:

| Target | Bun compile flag | Use case |
|---|---|---|
| `linux-x64` | `bun-linux-x64` | Primary VPS (amd64) |
| `linux-arm64` | `bun-linux-arm64` | ARM VPS (Graviton, Raspberry Pi server) |
| `darwin-arm64` | `bun-darwin-arm64` | macOS Apple Silicon |
| `darwin-x64` | `bun-darwin-x64` | macOS Intel |

Build is orchestrated by `scripts/build.ts`:

1. Build SvelteKit dashboard (`dashboard/build/`)
2. Generate `dashboard-assets.generated.ts` with embedded file imports
3. Compile with `bun build --compile`

Version is injected at compile time from `src/version.ts` via `--define BUILD_VERSION=...`.

## Release Artifacts

GitHub Release format:

```text
bakend-v{version}-linux-x64.tar.gz
bakend-v{version}-linux-arm64.tar.gz
bakend-v{version}-darwin-arm64.tar.gz
bakend-v{version}-darwin-x64.tar.gz
```

Each tarball contains:

- `bak` — compiled executable
- `LICENSE`
- `bakend.json.example`

SHA256 checksums are published alongside release assets.

Latest-release aliases are also published for `install.sh`:

```text
bakend-latest-linux-x64.tar.gz
bakend-latest-linux-arm64.tar.gz
bakend-latest-darwin-arm64.tar.gz
bakend-latest-darwin-x64.tar.gz
```

## Dashboard Embedding

The admin dashboard is built with `@sveltejs/adapter-static` (base path `/_`). At compile time, all files under `dashboard/build/` are embedded using Bun's `import ... with { type: "file" }` mechanism.

At runtime:

- **Dev mode** (`bun run`): serve from `dashboard/build/` on disk
- **Compiled mode**: serve from embedded asset manifest

See RFC-0011 — dashboard bundling is implemented in Milestone 12.

## Docker Image

Multi-stage build:

1. **builder** — `oven/bun` image, runs `bun run build`
2. **runtime** — minimal image with compiled binary only

Runtime contract:

| Setting | Value |
|---|---|
| Binary path | `/bak` |
| Exposed port | `8080` |
| Data volume | `/data` |
| Working directory | `/data` |
| Entrypoint | `/bak start --config /data/bakend.json` |
| User | non-root (`bakend`, uid 1000) |

Environment overrides use existing `BAKEND_*` variables from config loader.

Mount `/data` with `bakend.json`, `collections/`, `functions/`, `jobs/`, database, and storage.

Image published to `ghcr.io` on version tags.

## systemd Integration

Unit file at `packaging/systemd/bakend.service`:

- `Type=simple`
- `WorkingDirectory=/opt/bakend`
- `ExecStart=/opt/bakend/bak start --config /opt/bakend/bakend.json`
- `KillSignal=SIGTERM` (graceful shutdown already implemented)
- `Restart=on-failure`

Operators must:

1. Create a dedicated `bakend` system user
2. Set `auth.jwtSecret` in production config
3. Open firewall for configured port

## Upgrade Process

Internal SQLite schema migrations run automatically on every `bak start` via `src/core/database/init.ts`. No separate `bak migrate` is required for internal schema in Milestone 12.

Manual binary upgrade procedure:

1. Stop the service (`systemctl stop bakend`)
2. Backup database and storage manually (`cp bakend.db`, archive `storage/`)
3. Download new release binary and verify SHA256
4. Replace binary
5. Confirm with `bak version`
6. Start service and verify `/health`

See RFC-0018 for versioning policy.

## Install Script

`scripts/install.sh` provides a minimal installer:

- Detects OS/architecture
- Downloads release asset (via `BAKEND_INSTALL_URL` or GitHub Releases API)
- Installs binary to `/usr/local/bin/bak`
- Optionally installs systemd unit

Full hosting at `bakend.dev` is deferred.

## CLI Additions

| Command | Description |
|---|---|
| `bak version` | Print Bakend version |

## Implementation

| Path | Purpose |
|---|---|
| `scripts/build.ts` | Build orchestration |
| `scripts/install.sh` | Minimal installer |
| `packaging/systemd/bakend.service` | systemd unit template |
| `Dockerfile` | Multi-stage container build |
| `docker-compose.yml` | Local VPS simulation |
| `.github/workflows/release.yml` | Release CI |

## Website (Milestone 13)

Static marketing site at `website/` (Astro), deployed to GitHub Pages. Full hosting at `bakend.dev` remains optional.

## Status

Implemented — Milestone 12 (packaging), Milestone 13 (beta website, install aliases)
