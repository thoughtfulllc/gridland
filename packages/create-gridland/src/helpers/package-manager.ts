export type PackageManager = "npm" | "yarn" | "pnpm" | "bun"

type DlxCommand = readonly [string, ...string[]]

const commands: Record<PackageManager, {
  install: string
  dev: string
  dlx: DlxCommand
}> = {
  npm:  { install: "npm install",  dev: "npm run dev", dlx: ["npx"] },
  yarn: { install: "yarn",         dev: "yarn dev",    dlx: ["yarn", "dlx"] },
  pnpm: { install: "pnpm install", dev: "pnpm dev",    dlx: ["pnpm", "dlx"] },
  bun:  { install: "bun install",  dev: "bun dev",     dlx: ["bunx"] },
}

export function detectPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent ?? ""

  if (userAgent.startsWith("yarn")) return "yarn"
  if (userAgent.startsWith("pnpm")) return "pnpm"
  if (userAgent.startsWith("bun")) return "bun"
  return "npm"
}

export function getInstallCommand(pm: PackageManager): string {
  return commands[pm].install
}

export function getDevCommand(pm: PackageManager): string {
  return commands[pm].dev
}

/**
 * Returns `[command, ...prefixArgs]` for spawning a throwaway package
 * (e.g. `["npx"]`, `["bunx"]`, `["pnpm", "dlx"]`, `["yarn", "dlx"]`).
 * Designed for use with `spawnSync(file, args)` — never interpolated into a shell.
 */
export function getDlxCommand(pm: PackageManager): DlxCommand {
  return commands[pm].dlx
}
