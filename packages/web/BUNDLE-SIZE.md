# @gridland/web bundle size baseline

Measured for tasks/003-browser-compat-contract.md Phase 0 D0.2 and Phase 3 G6 (12 KB gzipped delta budget).

| Entry point | Raw (bytes) | Gzipped (bytes) | Gzipped (KB) |
|---|--:|--:|--:|
| `dist/index.js` | 872600 | 173377 | 169.3 |
| `dist/next.js` | 868166 | 172501 | 168.5 |

**Measurement method:**

```sh
bun run --cwd packages/web build
for f in packages/web/dist/index.js packages/web/dist/next.js; do
  echo "$(basename $f): raw=$(wc -c < "$f"), gzipped=$(gzip -c "$f" | wc -c)"
done
```

**Captured on:** 2026-04-14, branch `bug-4-14`, commit base `6655e22` (Phase 1 refactor applied; refactor is build-output-neutral since both paths compile to the same module-shape JS).

**Phase 3 budget (§8 and G6):** `@gridland/web` bundle-size delta ≤ **12 KB gzipped** after the full migration. The delta lands when `BrowserAsciiFontRenderable`, `register.ts`, and the 7 font JSON files (~8.8 KB gzipped alone) are added in Phase 3. Re-measure the `index.js` gzipped size post-Phase 3 and subtract this baseline.

**What "12 KB" means in context:** 173377 → 173377 + 12288 = 185665 bytes gzipped is the hard ceiling. Soft miss (≤ 10% over = 13.2 KB actual) is a file-follow-up, not a block. Hard miss (> 13.2 KB) blocks Phase 3.

## Phase 3 measurements (post-merge)

| Entry point | Raw (bytes) | Gzipped (bytes) | Delta vs baseline |
|---|--:|--:|--:|
| `dist/index.js` | 874837 | 173868 | **+491 bytes gzipped (+0.28%)** |
| `dist/next.js` | 870403 | 173002 | **+501 bytes gzipped (+0.29%)** |

**Verdict: well under budget.** We used 491 / 12288 = **4%** of the Phase 3 gzipped-delta budget.

**Why so small** — the seven font JSON files (~8.8 KB gzipped) were already bundled via core's deep imports, since the terminal `ASCIIFontRenderable` in `@gridland/core` imports them and `@gridland/web` imports core directly via the `../../core/src/...` precedent (see §4.3 of the spec). Phase 3 only adds the thin `BrowserAsciiFontRenderable` wrapper (~60 LOC) and the `register.ts` side-effect module (~15 LOC) — the font data was already free.

**Re-measurement command:**

```sh
bun run --cwd packages/web build
for f in packages/web/dist/index.js packages/web/dist/next.js; do
  raw=$(wc -c < "$f")
  gz=$(gzip -c "$f" | wc -c)
  printf "%-10s raw=%d gzipped=%d\n" "$(basename $f)" $raw $gz
done
```
