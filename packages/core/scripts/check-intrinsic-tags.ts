/**
 * Build-time checker for tasks/003 INV-1:
 * `componentCatalogue` keys and `intrinsicCapabilities` keys must be
 * identical sets. Exits non-zero with an actionable message on drift.
 *
 * Pure function in `checkIntrinsicTags` so tests can drive it with
 * synthetic key sets; CLI mode runs against the real catalogue.
 */

import { componentCatalogue } from "../src/react/components"
import { intrinsicCapabilities } from "../src/react/types/runtime-capability"

export type CheckResult = { ok: true } | { ok: false; error: string }

export function checkIntrinsicTags(
  catalogueKeys: readonly string[],
  capabilityKeys: readonly string[],
): CheckResult {
  const cSet = new Set(catalogueKeys)
  const kSet = new Set(capabilityKeys)

  const missingTags: string[] = []
  for (const key of cSet) if (!kSet.has(key)) missingTags.push(key)

  const staleTags: string[] = []
  for (const key of kSet) if (!cSet.has(key)) staleTags.push(key)

  if (missingTags.length === 0 && staleTags.length === 0) {
    return { ok: true }
  }

  const lines: string[] = [
    "check-intrinsic-tags: componentCatalogue keys and intrinsicCapabilities keys diverged.",
  ]
  if (missingTags.length > 0) {
    lines.push(
      `  Catalogue intrinsics missing/untagged from intrinsicCapabilities (${missingTags.length}):`,
      ...missingTags.sort().map((k) => `    - ${k}`),
      `  Fix: add these names to packages/core/src/react/types/runtime-capability.ts with an explicit RuntimeCapability tag.`,
    )
  }
  if (staleTags.length > 0) {
    lines.push(
      `  Stale capability entries not present in componentCatalogue (${staleTags.length}):`,
      ...staleTags.sort().map((k) => `    - ${k}`),
      `  Fix: remove these keys from intrinsicCapabilities, or re-add the renderable to the catalogue.`,
    )
  }
  lines.push("See tasks/003-browser-compat-contract.md §4.4 and INV-1.")

  return { ok: false, error: lines.join("\n") }
}

// CLI entry point — executed by `bun run --cwd packages/core build`.
if (import.meta.main) {
  const result = checkIntrinsicTags(
    Object.keys(componentCatalogue),
    Object.keys(intrinsicCapabilities),
  )
  if (!result.ok) {
    console.error(result.error)
    process.exit(1)
  }
  console.log(
    `check-intrinsic-tags: OK (${Object.keys(intrinsicCapabilities).length} intrinsics, all tagged)`,
  )
}
