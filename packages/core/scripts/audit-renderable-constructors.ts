/**
 * Phase 4 D4.6 — monorepo-wide audit of the renderable-constructor rule.
 *
 * The lint scope at packages/core/scripts/lint-renderable-constructors.ts
 * only walks packages/core/src/renderables and packages/web/src/components.
 * This audit walks the entire monorepo (packages/star/src) to surface any
 * constructor-body calls to forbidden runtime singletons OUTSIDE that lint
 * scope — so the team can decide whether to expand the rule, whitelist the
 * call site, or fix it.
 *
 * Writes a CSV to tasks/003-audit-final.csv.
 *
 * Usage:
 *   bun run scripts/audit-renderable-constructors.ts
 */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { lintRenderableConstructor, type LintFinding } from "./lint-renderable-constructors"

const MONOREPO_ROOT = resolve(import.meta.dirname, "../../..")
const PACKAGES_DIR = join(MONOREPO_ROOT, "packages")

function listTypeScriptFiles(rootDir: string): string[] {
  const out: string[] = []
  function walk(dir: string): void {
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const entry of entries) {
      const full = join(dir, entry)
      let st
      try {
        st = statSync(full)
      } catch {
        continue
      }
      if (st.isDirectory()) {
        if (entry === "node_modules" || entry === "dist" || entry === "__tests__") continue
        walk(full)
      } else if (st.isFile() && (entry.endsWith(".ts") || entry.endsWith(".tsx"))) {
        if (entry.endsWith(".test.ts") || entry.endsWith(".test.tsx")) continue
        if (entry.endsWith(".d.ts")) continue
        out.push(full)
      }
    }
  }
  walk(rootDir)
  return out
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const packageDirs = readdirSync(PACKAGES_DIR)
  .map((name) => join(PACKAGES_DIR, name, "src"))
  .filter((p) => {
    try {
      return statSync(p).isDirectory()
    } catch {
      return false
    }
  })

let totalFiles = 0
const allFindings: LintFinding[] = []

for (const srcDir of packageDirs) {
  const files = listTypeScriptFiles(srcDir)
  totalFiles += files.length
  for (const file of files) {
    const source = readFileSync(file, "utf-8")
    const relName = relative(MONOREPO_ROOT, file)
    const findings = lintRenderableConstructor(relName, source)
    allFindings.push(...findings)
  }
}

const outputPath = join(MONOREPO_ROOT, "tasks/003-audit-final.csv")
mkdirSync(dirname(outputPath), { recursive: true })

const rows = [
  "filename,line,column,message",
  ...allFindings.map(
    (f) => `${csvEscape(f.filename)},${f.line},${f.column},${csvEscape(f.message)}`,
  ),
]
writeFileSync(outputPath, rows.join("\n") + "\n", "utf-8")

console.log(
  `audit-renderable-constructors: scanned ${totalFiles} files across ${packageDirs.length} packages`,
)
console.log(`  findings: ${allFindings.length}`)
console.log(`  CSV: ${relative(MONOREPO_ROOT, outputPath)}`)

if (allFindings.length > 0) {
  console.log("\nFindings (not necessarily bugs — wider than the lint scope):")
  for (const f of allFindings) {
    console.log(`  ${f.filename}:${f.line}:${f.column}  ${f.message}`)
  }
}
