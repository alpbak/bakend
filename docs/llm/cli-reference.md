# CLI Reference

The `bak` executable is the primary interface for Bakend projects.

> Status: Planned — commands will be implemented across Milestones 1, 5, 6, and 12.

## Commands

| Command | Description | Milestone |
|---|---|---|
| `bak init [name]` | Create a new Bakend project | 1 |
| `bak start` | Start the Bakend server | 1 |
| `bak dev` | Start with hot reload for functions | 5 |
| `bak migrate` | Run database migrations | 3 |
| `bak functions` | List and manage functions | 5 |
| `bak jobs` | List and manage jobs | 6 |

## Examples

```bash
bak init myapp
cd myapp
bak start
```

```bash
bak dev
```

```bash
bak migrate
```

## Configuration

Default config file: `bakend.json`

```json
{
  "port": 8080,
  "database": "./bakend.db",
  "storage": "./storage"
}
```
