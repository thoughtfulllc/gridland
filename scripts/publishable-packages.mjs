import { readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
export const PACKAGES_DIR = join(ROOT, "packages")

/**
 * Read every packages/* /package.json, skip private ones, return
 * { name, version, path, pkgJson } sorted by name.
 */
export function getPublishablePackages() {
  const entries = []
  for (const name of readdirSync(PACKAGES_DIR)) {
    const pkgPath = join(PACKAGES_DIR, name, "package.json")
    let raw
    try {
      raw = readFileSync(pkgPath, "utf8")
    } catch {
      continue
    }
    const pkgJson = JSON.parse(raw)
    if (pkgJson.private === true) continue
    entries.push({ name: pkgJson.name, version: pkgJson.version, path: pkgPath, pkgJson })
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name))
}
