import { execSync } from "node:child_process"
import { type PackageManager, getInstallCommand } from "./package-manager.js"

export function installDependencies(
  cwd: string,
  packageManager: PackageManager,
): boolean {
  try {
    execSync(getInstallCommand(packageManager), {
      cwd,
      stdio: "ignore",
    })
    return true
  } catch {
    return false
  }
}
