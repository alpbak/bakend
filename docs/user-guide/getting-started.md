# Getting Started

Install [Bun](https://bun.sh), clone the repository, and install dependencies:

```bash
git clone https://github.com/alpbak/bakend.git
cd bakend
bun install
```

## Configuration

Copy the example config and adjust as needed:

```bash
cp bakend.json.example bakend.json
```

```json
{
  "port": 8080,
  "database": "./bakend.db",
  "storage": "./storage",
  "logLevel": "INFO"
}
```

If `bakend.json` is missing, Bakend uses these defaults.

Environment overrides:

- `BAKEND_PORT`
- `BAKEND_DATABASE`
- `BAKEND_STORAGE`
- `BAKEND_LOG_LEVEL`

## Start the Server

```bash
bun run start
```

Or with the CLI bin:

```bash
bun run src/index.ts start
```

Expected output:

```text
Bakend v0.1

Database: ready
API: ready

Listening on :8080
```

## Verify

```bash
curl http://localhost:8080/health
```

```json
{ "status": "ok", "version": "0.1.0" }
```

## Custom Config Path

```bash
bun run src/index.ts start --config path/to/bakend.json
```
