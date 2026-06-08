# CLI Reference

The `bak` executable is the primary interface for Bakend projects.

## Commands

| Command | Description | Status |
|---|---|---|
| `bak start [--config <path>]` | Start the Bakend server | Implemented |
| `bak init [name]` | Create a new Bakend project | Planned |
| `bak dev` | Start with hot reload for functions | Planned |
| `bak migrate` | Run database migrations | Planned |
| `bak functions` | List and manage functions | Planned |
| `bak jobs` | List and manage jobs | Planned |

## Examples

```bash
bun run start
```

```bash
bun run src/index.ts start --config ./bakend.json
```

```bash
bun run src/index.ts --help
```

## Configuration

Default config file: `bakend.json`

```json
{
  "port": 8080,
  "database": "./bakend.db",
  "storage": "./storage",
  "logLevel": "INFO"
}
```

Environment overrides:

- `BAKEND_PORT`
- `BAKEND_DATABASE`
- `BAKEND_STORAGE`
- `BAKEND_LOG_LEVEL`

Log levels: `DEBUG`, `INFO`, `WARN`, `ERROR`
