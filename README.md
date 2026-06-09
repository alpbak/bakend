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

## Built in Public

As described in [Why Bakend Exists](docs/why-bakend.md), Bakend is a complete rewrite of a personal backend framework that has been used for real-world projects and MVPs for years.

Unlike the original private codebase, Bakend is being developed entirely in the open and embraces AI-assisted development. Architecture, RFCs, documentation, and implementation are designed to be accessible to both human contributors and AI coding agents.

### AI-Assisted Development

Bakend embraces AI-assisted development.

The project is designed to be accessible to both human contributors and AI coding agents. Documentation, RFCs, architecture decisions, and development workflows are intentionally structured to make the project easier to understand, maintain, and contribute to.

We believe the quality of a contribution matters more than how it was produced.

Whether code is written by a human, generated with the assistance of AI, or created through a combination of both, the same standards apply:

- The contributor must understand the code they submit.
- Changes must follow the architecture and RFCs.
- Tests and documentation are required.
- Contributions are evaluated on quality, correctness, and maintainability.

AI is a tool, not a substitute for engineering judgment.

Bakend is an experiment in building modern open-source software where humans and AI agents can collaborate effectively.

## License

MIT — see [LICENSE](LICENSE).
