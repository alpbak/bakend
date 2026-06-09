# Tutorial 03: Deploy to a VPS

Deploy Bakend on a Linux VPS using the release binary and systemd.

**Outcome:** Bakend runs as a system service, survives reboots, and responds on `/health`.

## Prerequisites

- Linux VPS (x64 or arm64) with SSH access
- `sudo` privileges
- Port `8080` open in your firewall (or change `port` in config)

## Step 1: Install the binary

Clone the repo to get `install.sh`, or download a release tarball manually.

**Option A — install script (latest release):**

```bash
git clone https://github.com/alpbak/bakend.git
cd bakend
sudo sh scripts/install.sh
```

**Option B — specific version:**

```bash
sudo BAKEND_VERSION=0.1.0-beta sh scripts/install.sh
```

Verify:

```bash
bak version
```

## Step 2: Create project directory

```bash
sudo useradd --system --home /opt/bakend --shell /usr/sbin/nologin bakend || true
sudo mkdir -p /opt/bakend/{collections,functions,jobs,storage}
sudo cp bakend.json.example /opt/bakend/bakend.json
sudo chown -R bakend:bakend /opt/bakend
```

Edit production config:

```bash
sudo nano /opt/bakend/bakend.json
```

Set a strong `auth.jwtSecret` and adjust `port` if needed.

## Step 3: Add your project files

Copy collection definitions, functions, and jobs into `/opt/bakend/`:

```bash
sudo cp -r examples/todo-api/collections/* /opt/bakend/collections/
sudo cp -r examples/todo-api/functions/* /opt/bakend/functions/
sudo chown -R bakend:bakend /opt/bakend
```

For TypeScript functions and jobs, the production binary requires pre-built or compatible setup — for beta, start with collections and REST API, or run from source with Bun on the server for development VPS setups.

## Step 4: Install systemd unit

```bash
sudo cp packaging/systemd/bakend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now bakend
```

## Step 5: Verify

```bash
sudo systemctl status bakend
curl http://localhost:8080/health
```

From your machine (replace with your VPS IP):

```bash
curl http://<your-vps-ip>:8080/health
```

## Verify it works

- [ ] `bak version` prints the expected version
- [ ] `systemctl status bakend` shows `active (running)`
- [ ] `/health` returns `{"status":"ok",...}`
- [ ] Service restarts after `sudo systemctl restart bakend`

## Docker alternative

For containerized deployment:

```bash
export BAKEND_AUTH_JWT_SECRET=your-production-secret
mkdir -p data && cp bakend.json.example data/bakend.json
docker compose up -d
```

See [Deployment](../docs/user-guide/deployment.md) for full Docker and upgrade instructions.

## Next steps

- [Installation](../docs/user-guide/installation.md)
- [Deployment guide](../docs/user-guide/deployment.md)
- [Tutorial 01: Build a Todo API](01-todo-api.md)
