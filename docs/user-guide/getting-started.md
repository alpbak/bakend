# Getting Started

## Tutorials

New to Bakend? Start with [Tutorial 01: Build a Todo API](../../tutorials/01-todo-api.md).

## Production Deployment

For installing the binary, see [Installation](installation.md). For VPS or Docker deployment, see [Deployment](deployment.md).

## Create a Project

After installing the `bak` binary:

```bash
bak init myapp
cd myapp
bak start
```

`bak init` creates `bakend.json`, `collections/`, `functions/`, `jobs/`, and a generated JWT secret.

## Development Setup

Install [Bun](https://bun.sh), clone the repository, and install dependencies:

```bash
git clone https://github.com/alpbak/bakend.git
cd bakend
bun install
```

From the repo you can run `bun run src/index.ts init myapp` or scaffold in place:

```bash
mkdir myapp && cd myapp
bun run ../src/index.ts init
```

## Configuration

`bakend.json` (created by `bak init`):

```json
{
  "port": 8080,
  "database": "./bakend.db",
  "storage": "./storage",
  "logLevel": "INFO",
  "auth": {
    "jwtSecret": "<generated>",
    "accessTokenTtl": "15m",
    "refreshTokenTtl": "7d"
  }
}
```

Paths are relative to the `bakend.json` file location.

Environment overrides:

- `BAKEND_PORT`
- `BAKEND_DATABASE`
- `BAKEND_STORAGE`
- `BAKEND_LOG_LEVEL`
- `BAKEND_LOG_FILE`

## Start the Server

```bash
bak start
```

Or from the Bakend repo during development:

```bash
bun run start
```

Expected output:

```text
Bakend v1.0

Database: ready
API: ready

Listening on :8080
```

## Verify

```bash
curl http://localhost:8080/health
```

```json
{ "status": "ok", "version": "1.0.0" }
```

## Custom Config Path

```bash
bak start --config path/to/bakend.json
```
