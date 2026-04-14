#!/usr/bin/env node
/**
 * One-shot publish: bump → swap workspace:* → build → test → smoke → publish → restore → commit → push.
 *
 * Usage:
 *   bun scripts/publish.mjs <patch|minor|major|X.Y.Z> [--otp=CODE] [--skip-tests] [--dry-run]
 *
 * Any failure after the workspace:* swap triggers a restore so the tree isn't
 * left with literal versions in intra-package deps.
 */
import { execSync, spawnSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { createInterface } from "node:readline/promises"
import { stdin, stdout } from "node:process"
import { getPublishablePackages, ROOT } from "./publishable-packages.mjs"

const args = process.argv.slice(2)
const positional = args.filter((a) => !a.startsWith("--"))
const flags = new Map(
  args
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const eq = a.indexOf("=")
      return eq === -1 ? [a.slice(2), true] : [a.slice(2, eq), a.slice(eq + 1)]
    }),
)

const bumpArg = positional[0]
if (!bumpArg) {
  console.error("usage: bun scripts/publish.mjs <patch|minor|major|X.Y.Z> [--otp=CODE] [--skip-tests] [--dry-run]")
  process.exit(1)
}

const DRY_RUN = flags.get("dry-run") === true
const SKIP_TESTS = flags.get("skip-tests") === true
let otp = flags.get("otp")
if (typeof otp === "boolean") otp = undefined

/**
 * Topologically order the publishable packages so each dep is published before
 * its dependents. Derived from manifests so new packages are picked up automatically.
 */
function computePublishOrder(pkgs) {
  const byName = new Map(pkgs.map((p) => [p.name, p]))
  const intraDeps = new Map()
  for (const pkg of pkgs) {
    const deps = new Set()
    for (const depType of ["dependencies", "peerDependencies"]) {
      const block = pkg.pkgJson[depType]
      if (!block) continue
      for (const name of Object.keys(block)) if (byName.has(name)) deps.add(name)
    }
    intraDeps.set(pkg.name, deps)
  }
  const ordered = []
  const visited = new Set()
  const visiting = new Set()
  function visit(name) {
    if (visited.has(name)) return
    if (visiting.has(name)) throw new Error(`dependency cycle at ${name}`)
    visiting.add(name)
    for (const dep of intraDeps.get(name)) visit(dep)
    visiting.delete(name)
    visited.add(name)
    ordered.push(name)
  }
  for (const name of [...byName.keys()].sort()) visit(name)
  return ordered
}

// Template package.jsons that use hardcoded "^x.y.z" references to @gridland/*.
// These are end-user scaffolds, not workspaces. Version bumps here are kept (committed).
const TEMPLATES = [
  "packages/create-gridland/templates/vite/package.json",
  "packages/create-gridland/templates/next/package.json",
]

function log(msg) {
  console.log(`\n▸ ${msg}`)
}

function run(cmd, { cwd = ROOT, env = process.env } = {}) {
  const result = spawnSync(cmd[0], cmd.slice(1), { cwd, env, stdio: "inherit" })
  if (result.status !== 0) {
    throw new Error(`command failed (${result.status}): ${cmd.join(" ")}`)
  }
}

function gitClean() {
  // Modifications to tracked files under the paths we edit would conflict with
  // the atomic swap/restore dance. Untracked files are fine — nothing we do
  // touches them, and the commit step stages specific paths only.
  const paths = ["packages", "scripts", "package.json"]
  const out = execSync(`git status --porcelain -- ${paths.join(" ")}`, { cwd: ROOT, encoding: "utf8" })
  return out
    .split("\n")
    .filter(Boolean)
    .every((line) => line.startsWith("??"))
}

async function readOtp() {
  if (otp) return otp
  if (DRY_RUN) return "DRYRUN"
  const rl = createInterface({ input: stdin, output: stdout })
  const answer = (await rl.question("\nnpm OTP (leave empty if not required): ")).trim()
  rl.close()
  return answer
}

function parseSemver(v) {
  const m = String(v).match(/^(\d+)\.(\d+)\.(\d+)$/)
  if (!m) throw new Error(`invalid semver: ${v}`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}
function cmpSemver(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i]
  return 0
}
function fmtSemver([a, b, c]) {
  return `${a}.${b}.${c}`
}

function computeNextVersion(pkgs, bump) {
  let max = parseSemver(pkgs[0].version)
  for (const p of pkgs) if (cmpSemver(parseSemver(p.version), max) > 0) max = parseSemver(p.version)
  if (bump === "patch") return fmtSemver([max[0], max[1], max[2] + 1])
  if (bump === "minor") return fmtSemver([max[0], max[1] + 1, 0])
  if (bump === "major") return fmtSemver([max[0] + 1, 0, 0])
  const explicit = parseSemver(bump)
  if (cmpSemver(explicit, max) <= 0) {
    throw new Error(`refusing to downgrade: ${bump} ≤ current max ${fmtSemver(max)}`)
  }
  return fmtSemver(explicit)
}

function writeJsonVersion(pkgPath, nextVersion) {
  const raw = readFileSync(pkgPath, "utf8")
  const replaced = raw.replace(/("version"\s*:\s*)"[^"]+"/, `$1"${nextVersion}"`)
  if (replaced === raw) throw new Error(`no version field replaced in ${pkgPath}`)
  writeFileSync(pkgPath, replaced)
}

/**
 * Snapshot original package.json content, then rewrite every intra-monorepo
 * "workspace:*" (or "workspace:^" etc.) to the concrete version. Restore from
 * snapshot on failure OR after a successful publish.
 */
function snapshotAndSwap(pkgs, nextVersion) {
  const publishedNames = new Set(pkgs.map((p) => p.name))
  const snapshots = []
  for (const pkg of pkgs) {
    const original = readFileSync(pkg.path, "utf8")
    snapshots.push({ path: pkg.path, original })
    const parsed = JSON.parse(original)
    let changed = false
    for (const depType of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
      const deps = parsed[depType]
      if (!deps) continue
      for (const [name, value] of Object.entries(deps)) {
        if (typeof value !== "string" || !value.startsWith("workspace:")) continue
        if (publishedNames.has(name)) {
          deps[name] = nextVersion
        } else {
          // Private workspace package — not on npm. A literal workspace:*
          // in a published tarball would make `bun install` choke, so strip it.
          // It's fine because private workspaces aren't installable anyway.
          delete deps[name]
        }
        changed = true
      }
    }
    if (changed) {
      const trailing = original.endsWith("\n") ? "\n" : ""
      writeFileSync(pkg.path, JSON.stringify(parsed, null, 2) + trailing)
    }
  }
  return snapshots
}

function restoreSnapshots(snapshots) {
  for (const { path, original } of snapshots) writeFileSync(path, original)
}

function bumpTemplates(nextVersion) {
  for (const rel of TEMPLATES) {
    const p = join(ROOT, rel)
    const raw = readFileSync(p, "utf8")
    const replaced = raw.replace(
      /("@gridland\/(?:utils|web|demo)"\s*:\s*)"[^"]*"/g,
      `$1"^${nextVersion}"`,
    )
    if (replaced !== raw) writeFileSync(p, replaced)
  }
}

async function publishOne(pkg, currentOtp) {
  const cwd = pkg.path.replace(/\/package\.json$/, "")
  const cmd = ["npm", "publish", "--access", "public"]
  if (currentOtp && currentOtp !== "DRYRUN") cmd.push(`--otp=${currentOtp}`)
  if (DRY_RUN) cmd.push("--dry-run")
  log(`publishing ${pkg.name}@${pkg.version} (cwd=${cwd})`)
  run(cmd, { cwd })
}

async function publishAll(pkgs, nextVersion) {
  const byName = new Map(pkgs.map((p) => [p.name, p]))
  const order = computePublishOrder(pkgs)
  for (const name of order) {
    const pkg = byName.get(name)
    if (!pkg) throw new Error(`publishable package missing from disk: ${name}`)
    // Re-read the on-disk version (bump already happened).
    const latest = { ...pkg, version: JSON.parse(readFileSync(pkg.path, "utf8")).version }
    if (latest.version !== nextVersion) {
      throw new Error(`${name} version ${latest.version} ≠ expected ${nextVersion}`)
    }
    try {
      await publishOne(latest, otp)
    } catch (err) {
      // Most common recoverable case: OTP expired mid-publish. Re-prompt and retry.
      const msg = String(err.message || "")
      if (/EOTP|one-time|otp/i.test(msg) && !DRY_RUN) {
        console.log(`\nOTP failed for ${name}. Need a fresh code.`)
        const rl = createInterface({ input: stdin, output: stdout })
        otp = (await rl.question("new npm OTP: ")).trim()
        rl.close()
        await publishOne(latest, otp)
      } else {
        throw err
      }
    }
  }
}

function gitCommitAndPush(nextVersion) {
  const paths = [
    ...getPublishablePackages().map((p) => p.path),
    ...TEMPLATES.map((t) => join(ROOT, t)),
  ]
  run(["git", "add", "--", ...paths])
  run(["git", "commit", "-m", `chore: publish v${nextVersion}`])
  run(["git", "push"])
}

async function main() {
  if (!gitClean()) {
    console.error("✗ working tree is dirty in packages/ scripts/ or package.json")
    console.error("  commit or stash first; the publish script needs a clean slate to make atomic changes")
    execSync(`git status --short -- packages scripts package.json`, { stdio: "inherit", cwd: ROOT })
    process.exit(1)
  }

  const pkgs = getPublishablePackages()
  if (pkgs.length === 0) throw new Error("no publishable packages found")

  const nextVersion = computeNextVersion(pkgs, bumpArg)
  log(`target version: ${nextVersion}`)

  // 1. Bump all top-level versions.
  log("bumping versions")
  for (const p of pkgs) writeJsonVersion(p.path, nextVersion)

  // 2. Bump template @gridland/* refs to ^<next>.
  log("updating template ^versions")
  bumpTemplates(nextVersion)

  // 3. Swap workspace:* → <next> (snapshot for restore).
  log("swapping workspace:* → real versions")
  const snapshots = snapshotAndSwap(pkgs, nextVersion)

  let published = false
  try {
    // 4. Build.
    log("building (bun run build)")
    run(["bun", "run", "build"])

    // 5. Test.
    if (!SKIP_TESTS) {
      log("running tests (bun run test)")
      run(["bun", "run", "test"])
    } else {
      log("skipping tests (--skip-tests)")
    }

    // 6. Smoke test.
    log("smoke-testing tarballs")
    run(["node", "scripts/smoke-test-publish.mjs"])

    // 7. Ask for OTP (if not yet provided) and publish in dep order.
    otp = await readOtp()
    log(`publishing ${pkgs.length} packages${DRY_RUN ? " (dry run)" : ""}`)
    await publishAll(pkgs, nextVersion)
    published = true
  } finally {
    log("restoring workspace:* in package manifests")
    restoreSnapshots(snapshots)
  }

  if (!published) {
    console.error("\n✗ publish aborted — workspace:* restored; bumped versions still on disk")
    process.exit(1)
  }

  if (DRY_RUN) {
    log("dry-run complete — not committing or pushing")
    return
  }

  // 8. Commit the bump + template changes, push.
  log("committing + pushing")
  gitCommitAndPush(nextVersion)

  log(`✓ published v${nextVersion}`)
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`)
  process.exit(1)
})
