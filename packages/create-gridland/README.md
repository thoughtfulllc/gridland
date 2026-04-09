# create-gridland

Scaffold a new [Gridland](https://gridland.io) project.

Gridland is a React framework for building terminal apps that also run in the browser — same source, same components, two runtime targets.

## Usage

```bash
bunx create-gridland my-app
```

You'll be prompted to choose a template:

- **CLI app** — Bun-powered terminal app (`@gridland/bun`)
- **Vite** — Browser app that renders TUI components on an HTML canvas (`@gridland/web`)
- **Next.js** — Next.js site with embedded Gridland TUI components

Then:

```bash
cd my-app
bun install
bun dev
```

## Documentation

Full docs at [gridland.io/docs](https://gridland.io/docs)

Source: [github.com/thoughtfulllc/gridland](https://github.com/thoughtfulllc/gridland)
