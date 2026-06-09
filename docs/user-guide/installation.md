# Installation

Install Bakend as a compiled binary for production, or run from source for development.

For deployment on a VPS (systemd, Docker, upgrades), see [Deployment](deployment.md).

## Requirements

**Binary install (production):**

- Linux (x64 or arm64) or macOS (x64 or arm64)
- No Bun or Node.js required on the server

**Development install:**

- [Bun](https://bun.sh) 1.1+
- Git

## One-liner install

Hosted install script (GitHub Pages):

```bash
curl -fsSL https://alpbak.github.io/bakend/install.sh | sudo sh
```

Optional custom domain: point `bakend.dev` DNS to GitHub Pages and use the same path (`/install.sh`).

## Install from GitHub Releases

Download the archive for your platform from [GitHub Releases](https://github.com/alpbak/bakend/releases):

```text
bakend-v{version}-linux-x64.tar.gz
bakend-v{version}-linux-arm64.tar.gz
bakend-v{version}-darwin-arm64.tar.gz
bakend-v{version}-darwin-x64.tar.gz
```

Extract and verify:

```bash
tar -xzf bakend-v1.0.1-linux-x64.tar.gz
sha256sum -c bakend-v1.0.1-linux-x64.tar.gz.sha256
sudo install -m 755 bak /usr/local/bin/bak
bak version
```

Each archive contains `bak`, `LICENSE`, and `bakend.json.example`.

## Install script (from repository)

```bash
# Latest release (uses bakend-latest-{os}-{arch}.tar.gz alias on GitHub Releases)
sudo sh scripts/install.sh
```

Install a specific version:

```bash
sudo BAKEND_VERSION=1.0.1 sh scripts/install.sh
```

Optional systemd unit (requires repo checkout with `packaging/systemd/bakend.service`):

```bash
sudo BAKEND_INSTALL_SYSTEMD=1 sh scripts/install.sh
```

## Scaffold a project

```bash
bak init myapp
cd myapp
bak start
```

## Docker

Pull the image from GitHub Container Registry:

```bash
docker pull ghcr.io/alpbak/bakend:latest
```

See [Deployment](deployment.md) for `docker-compose` and volume mounts.

## Development install

```bash
git clone https://github.com/alpbak/bakend.git
cd bakend
bun install
bun run src/index.ts init myapp
```

## SDKs

```bash
npm install @bakend/client
```

```bash
dart pub add bakend
```

See [SDK guide](sdk.md).
