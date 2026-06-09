# Deployment

Bakend ships as a single compiled binary with an embedded admin dashboard. No Bun or Node.js runtime is required on the server.

For local development, see [Getting Started](getting-started.md). For install options, see [Installation](installation.md).

## Release Binary

Download the archive for your platform from [GitHub Releases](https://github.com/alpbak/bakend/releases):

```text
bakend-v{version}-linux-x64.tar.gz
bakend-v{version}-linux-arm64.tar.gz
bakend-v{version}-darwin-arm64.tar.gz
bakend-v{version}-darwin-x64.tar.gz
```

Extract and verify the SHA256 checksum:

```bash
tar -xzf bakend-v0.1.0-linux-x64.tar.gz
sha256sum -c bakend-v0.1.0-linux-x64.tar.gz.sha256
```

## Project Layout

```text
/opt/bakend/
├── bak                 # compiled binary
├── bakend.json         # configuration
├── bakend.db           # SQLite database
├── storage/            # uploaded files
├── collections/        # collection definitions
├── functions/          # TypeScript functions
└── jobs/               # scheduled jobs
```

Copy `bakend.json.example` to `bakend.json` and set `auth.jwtSecret` for production.

## Start Manually

```bash
./bak start --config bakend.json
```

Verify:

```bash
curl http://localhost:8080/health
./bak version
```

## systemd

1. Create a dedicated user:

```bash
sudo useradd --system --home /opt/bakend --shell /usr/sbin/nologin bakend
```

2. Install the binary and config:

```bash
sudo mkdir -p /opt/bakend
sudo cp bak /opt/bakend/
sudo cp bakend.json.example /opt/bakend/bakend.json
sudo chown -R bakend:bakend /opt/bakend
```

3. Install the unit file from `packaging/systemd/bakend.service`:

```bash
sudo cp packaging/systemd/bakend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now bakend
```

4. Check status:

```bash
sudo systemctl status bakend
curl http://localhost:8080/health
```

## Docker

Build and run with Docker Compose:

```bash
export BAKEND_AUTH_JWT_SECRET=your-production-secret
mkdir -p data
cp bakend.json.example data/bakend.json
docker compose up -d
```

Or run the image directly:

```bash
docker run -d \
  -p 8080:8080 \
  -v "$(pwd)/data:/data" \
  -e BAKEND_AUTH_JWT_SECRET=your-production-secret \
  ghcr.io/alpbak/bakend:latest
```

Mount `/data` with `bakend.json`, `collections/`, `functions/`, `jobs/`, database, and storage.

## Environment Overrides

| Variable | Config key |
|---|---|
| `BAKEND_PORT` | `port` |
| `BAKEND_DATABASE` | `database` |
| `BAKEND_STORAGE` | `storage` |
| `BAKEND_LOG_LEVEL` | `logLevel` |
| `BAKEND_AUTH_JWT_SECRET` | `auth.jwtSecret` |
| `BAKEND_DASHBOARD_ENABLED` | `dashboard.enabled` |

## Upgrade

1. Stop the service: `sudo systemctl stop bakend`
2. Backup database and storage:

```bash
cp bakend.db bakend.db.bak-$(date +%Y%m%d)
tar czf storage.bak-$(date +%Y%m%d).tar.gz storage/
```

3. Download and replace the binary; verify SHA256
4. Confirm version: `/opt/bakend/bak version`
5. Start: `sudo systemctl start bakend`
6. Verify: `curl http://localhost:8080/health`

Internal database schema migrations run automatically on startup. See [RFC-0018](../rfcs/RFC-0018-Versioning-and-Upgrade-Policy.md).

## Install Script

See [Installation](installation.md) for full options. Quick examples:

```bash
# Latest release
sudo sh scripts/install.sh

# Specific version
sudo BAKEND_VERSION=0.1.0-beta sh scripts/install.sh
```

Optional systemd install (from repo checkout):

```bash
sudo BAKEND_INSTALL_SYSTEMD=1 sh scripts/install.sh
```
