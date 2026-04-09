import { readFileSync, writeFileSync } from "node:fs"
import { getPublishablePackages } from "./publishable-packages.mjs"

const arg = process.argv[2]
if (!arg) {
  console.error("usage: bun run bump <patch|minor|major|X.Y.Z>")
  process.exit(1)
}

function parse(v) {
  const m = String(v).match(/^(\d+)\.(\d+)\.(\d+)$/)
  if (!m) throw new Error(`invalid semver: ${v}`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}
function compare(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i]
  return 0
}
function format([a, b, c]) {
  return `${a}.${b}.${c}`
}

const pkgs = getPublishablePackages()
if (pkgs.length === 0) {
  console.error("no publishable packages found")
  process.exit(1)
}

let maxVersion = parse(pkgs[0].version)
for (const p of pkgs) {
  const v = parse(p.version)
  if (compare(v, maxVersion) > 0) maxVersion = v
}

let next
if (arg === "patch") next = [maxVersion[0], maxVersion[1], maxVersion[2] + 1]
else if (arg === "minor") next = [maxVersion[0], maxVersion[1] + 1, 0]
else if (arg === "major") next = [maxVersion[0] + 1, 0, 0]
else {
  next = parse(arg)
  if (compare(next, maxVersion) < 0) {
    console.error(`refusing to downgrade: ${arg} < current max ${format(maxVersion)}`)
    process.exit(1)
  }
}

const nextStr = format(next)
const VERSION_FIELD = /("version"\s*:\s*)"[^"]+"/
for (const p of pkgs) {
  const raw = readFileSync(p.path, "utf8")
  if (!VERSION_FIELD.test(raw)) throw new Error(`no top-level version field in ${p.path}`)
  const replaced = raw.replace(VERSION_FIELD, `$1"${nextStr}"`)
  if (replaced !== raw) writeFileSync(p.path, replaced)
  console.log(`  ${p.name}: ${p.version} → ${nextStr}`)
}
console.log(`\n✓ bumped ${pkgs.length} packages to ${nextStr}`)
console.log(`\nnext: commit the bump, then 'bun publish' in each package directory.`)
