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
tar -xzf bakend-v0.1.0-beta-linux-x64.tar.gz
sha256sum -c bakend-v0.1.0-beta-linux-x64.tar.gz.sha256
sudo install -m 755 bak /usr/local/bin/bak
bak version
```

Each archive contains `bak`, `LICENSE`, and `bakend.json.example`.

## Install script

From a cloned repository or downloaded `install.sh`:

```bash
# Latest release (uses bakend-latest-{os}-{arch}.tar.gz alias on GitHub Releases)
sudo sh scripts/install.sh
```

Install a specific version:

```bash
sudo BAKEND_VERSION=0.1.0-beta sh scripts/install.sh
```

Install from a direct URL:

```bash
sudo BAKEND_INSTALL_URL=https://github.com/alpbak/bakend/releases/download/v0.1.0-beta/bakend-v0.1.0-beta-linux-x64.tar.gz sh scripts/install.sh
```

Optional systemd unit (requires repo checkout with `packaging/systemd/bakend.service`):

```bash
sudo BAKEND_INSTALL_SYSTEMD=1 sh scripts/install.sh
```

## Docker

Pull the image from GitHub Container Registry:

```bash
docker pull ghcr.io/alpbak/bakend:latest
```

See [Deployment](deployment.md#docker) for volume mounts and `docker-compose`.

## Development install

Clone the repository and install dependencies:

```bash
git clone https://github.com/alpbak/bakend.git
cd bakend
bun install
cp bakend.json.example bakend.json
bun run start
```

See [Getting Started](getting-started.md) for configuration and first steps.

## Verify installation

```bash
bak version
curl http://localhost:8080/health
```

Open the admin dashboard at [http://localhost:8080/_/](http://localhost:8080/_/) when `dashboard.enabled` is true (default).
