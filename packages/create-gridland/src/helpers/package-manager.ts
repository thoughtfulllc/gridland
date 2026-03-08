export type PackageManager = "npm" | "yarn" | "pnpm" | "bun"

const commands: Record<PackageManager, { install: string; run: string; dev: string }> = {
  npm:  { install: "npm install",  run: "npx",  dev: "npm run dev" },
  yarn: { install: "yarn",         run: "yarn", dev: "yarn dev" },
  pnpm: { install: "pnpm install", run: "pnpm", dev: "pnpm dev" },
  bun:  { install: "bun install",  run: "bunx", dev: "bun dev" },
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

export function getRunCommand(pm: PackageManager): string {
  return commands[pm].run
}

export function getDevCommand(pm: PackageManager): string {
  return commands[pm].dev
}
