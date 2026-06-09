# Bakend

**The backend that gets out of your way.**

Bakend = PocketBase + Functions + Jobs

One executable. One database. One admin panel.

Bakend began as a private framework, rewritten for open source. [Why Bakend exists](docs/why-bakend.md).

## Status

**v1.0** — SQLite, collections, REST API, auth, storage, realtime, functions, jobs, dashboard, SDKs, CLI tooling, and single-binary deployment.

## Quick start

### Production (binary)

```bash
curl -fsSL https://alpbak.github.io/bakend/install.sh | sudo sh
bak init myapp
cd myapp
bak start
```

Download archives from [GitHub Releases](https://github.com/alpbak/bakend/releases) or see [Installation](docs/user-guide/installation.md) for Docker and platform-specific details.

### Development

```bash
git clone https://github.com/alpbak/bakend.git
cd bakend
bun install
bun run src/index.ts init myapp
cd myapp
bun run ../src/index.ts start
```

Open [http://localhost:8080/health](http://localhost:8080/health) and the [admin dashboard](http://localhost:8080/_/).

## Learn


| Resource      | Link                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------- |
| Documentation | [docs/README.md](docs/README.md) · [hosted docs](https://alpbak.github.io/bakend/docs/)   |
| Tutorials     | [tutorials/](tutorials/) · [hosted tutorials](https://alpbak.github.io/bakend/tutorials/) |
| Examples      | [examples/](examples/)                                                                    |
| Website       | [alpbak.github.io/bakend](https://alpbak.github.io/bakend/)                               |


## Repository

- **GitHub:** [github.com/alpbak/bakend](https://github.com/alpbak/bakend)
- **Roadmap:** [Bakend-Milestones.md](Bakend-Milestones.md)
- **Contributing:** [AGENTS.md](AGENTS.md)

## License

MIT — see [LICENSE](LICENSE).
