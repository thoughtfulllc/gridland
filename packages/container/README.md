# @gridland/container

Run [Gridland](https://gridland.io) apps (or any CLI) in an isolated Docker container — a safe sandbox for executing untrusted terminal code.

Useful for agent tools, code playgrounds, and review environments where you want to run someone else's CLI without giving it access to your machine.

## Requirements

- [Docker](https://www.docker.com) installed and running
- [Bun](https://bun.sh) 1.0 or later

## Run a demo in a sandbox

```bash
bunx @gridland/container @gridland/demo -- landing
```

## Supported sources

- **npm package**: `bunx @gridland/container <package> -- <args>`
- **GitHub repo**: `bunx @gridland/container github:user/repo -- <args>`
- **Local directory**: `bunx @gridland/container ./my-app -- <args>`

The container mounts only what's needed, runs with a non-root user, and tears down on exit.

## Documentation

Full docs at [gridland.io/docs](https://gridland.io/docs)

Source: [github.com/thoughtfulllc/gridland](https://github.com/thoughtfulllc/gridland)
