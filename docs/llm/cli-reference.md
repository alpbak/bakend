# CLI Reference

The `bak` executable is the primary interface for Bakend projects.

## Commands

| Command | Description | Status |
|---|---|---|
| `bak init [name]` | Create a new Bakend project | Implemented |
| `bak start [--config <path>] [--watch]` | Start the Bakend server | Implemented |
| `bak dev [--config <path>]` | Start with function hot reload | Implemented |
| `bak version` | Print Bakend version | Implemented |
| `bak functions list` | List registered function triggers | Implemented |
| `bak jobs list` | List registered jobs | Implemented |
| `bak jobs runs <name>` | Show recent runs for a job | Implemented |
| `bak migrate status` | Diff `collections/*.json` vs database | Implemented |
| `bak migrate apply` | Apply collection JSON files to database | Implemented |
| `bak migrate export` | Export database schemas to JSON files | Implemented |
| `bak backup create [--output <path>]` | Backup database and storage | Implemented |
| `bak backup restore <archive> [--force]` | Restore from backup archive | Implemented |
| `bak storage prune` | Remove orphan files not referenced by records | Implemented |

## Examples

```bash
bak init myapp
cd myapp
bak start
```

```bash
bak migrate status
bak migrate apply
bak migrate export
```

```bash
bak backup create --output ./backups/latest.tar.gz
```

```bash
bak functions list
bak jobs list
bak jobs runs heartbeat
```

## Production Binary

```bash
bak version
bak start --config bakend.json
```

See `docs/user-guide/deployment.md` for VPS, Docker, and systemd setup.

## Configuration

Default config file: `bakend.json` beside your project data.

Paths in config are resolved relative to the config file directory.

Log levels: `DEBUG`, `INFO`, `WARN`, `ERROR`
