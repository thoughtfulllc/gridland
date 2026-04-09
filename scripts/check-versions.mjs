import { getPublishablePackages } from "./publishable-packages.mjs"

const pkgs = getPublishablePackages()
const byVersion = new Map()
for (const p of pkgs) {
  if (!byVersion.has(p.version)) byVersion.set(p.version, [])
  byVersion.get(p.version).push(p.name)
}

if (byVersion.size === 1) {
  const [v] = byVersion.keys()
  console.log(`✓ all ${pkgs.length} publishable packages at ${v}`)
  process.exit(0)
}

console.error(`✗ version lockstep violation — ${byVersion.size} different versions found:`)
for (const [v, names] of byVersion) {
  console.error(`  ${v}: ${names.join(", ")}`)
}
console.error(`\nrun 'bun run bump <patch|minor|major|X.Y.Z>' to sync all packages.`)
process.exit(1)
