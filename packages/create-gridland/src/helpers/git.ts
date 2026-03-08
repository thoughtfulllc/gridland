import { execSync } from "node:child_process"

export function gitInit(cwd: string): boolean {
  try {
    execSync('git init && git add -A && git commit -m "Initial commit from create-gridland"', {
      cwd,
      stdio: "ignore",
    })
    return true
  } catch {
    return false
  }
}
