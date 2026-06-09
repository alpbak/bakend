# Bakend

**The backend that gets out of your way.**

Bakend = PocketBase + Functions + Jobs

One executable. One database. One admin panel.

## Status

**v0.1 beta** — SQLite, collections, REST API, auth, storage, realtime, functions, jobs, dashboard, SDKs, and single-binary deployment.

## Quick start

### Production (binary)

Download from [GitHub Releases](https://github.com/alpbak/bakend/releases) or use the install script:

```bash
git clone https://github.com/alpbak/bakend.git
cd bakend
sudo sh scripts/install.sh
bak version
```

See [Installation](docs/user-guide/installation.md) for platform-specific archives and Docker.

### Development

```bash
git clone https://github.com/alpbak/bakend.git
cd bakend
bun install
cp bakend.json.example bakend.json
bun run start
```

Open [http://localhost:8080/health](http://localhost:8080/health) and the [admin dashboard](http://localhost:8080/_/).

## Learn

| Resource | Link |
|----------|------|
| Documentation | [docs/README.md](docs/README.md) |
| Tutorials | [tutorials/](tutorials/) |
| Examples | [examples/](examples/) |
| Website | [alpbak.github.io/bakend](https://alpbak.github.io/bakend/) |

## Repository

- **GitHub:** [github.com/alpbak/bakend](https://github.com/alpbak/bakend)
- **Roadmap:** [Bakend-Milestones.md](Bakend-Milestones.md)
- **Contributing:** [AGENTS.md](AGENTS.md)

## License

MIT — see [LICENSE](LICENSE).
