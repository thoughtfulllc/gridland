---
name: release-check
description: Pre-release checklist. Runs all 5 agents plus snapshot regression test, TypeScript check, and semver confirmation. Run before publishing a new package version.
---

Run the full pre-release checklist before publishing. This is the most thorough check — all 5 agents plus tooling.

## Changed files since last tag

!`git diff --name-only $(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~10") HEAD`

## Current versions

!`cat packages/ui/package.json | grep '"version"'`
!`cat packages/utils/package.json | grep '"version"'`

## Step 1 — Run all 5 agents in parallel

Spawn simultaneously:
1. **contract-guardian** — breaking changes and semver recommendation
2. **framework-compliance** — patterns and keyboard coverage
3. **docs-mirror** — documentation accuracy and demo validity
4. **vendor-boundary** — SDK coupling check
5. **dependency-auditor** — external library usage check

## Step 2 — TypeScript check

After agents complete, run:
```bash
bun run --cwd packages/ui build 2>&1 | tail -30
bun run --cwd packages/utils build 2>&1 | tail -20
```

Flag any TypeScript errors as release blockers.

## Step 3 — Snapshot regression check

```bash
bun run --cwd packages/ui test 2>&1 | tail -40
bun run --cwd packages/web test 2>&1 | tail -40
```

If any snapshot tests fail: **do not update snapshots automatically**. Report which snapshots changed and ask for explicit confirmation before proceeding.

## Step 4 — Context sync check

Before confirming the release, verify CLAUDE.md is current:

```bash
git diff HEAD -- CLAUDE.md
```

If `CLAUDE.md` has not been updated since the last significant component or API change, flag it:

> "⚠️ CLAUDE.md may be out of date. Run `/sync-context` before releasing so future sessions have accurate context."

This is a warning, not a blocker — but context drift compounds across releases.

## Step 5 — Semver confirmation

Based on contract-guardian's recommendation:
- MAJOR bump: confirm the breaking changes are intentional and documented in CHANGELOG
- MINOR bump: confirm new additions are documented
- PATCH bump: confirm only bug fixes

Ask: "contract-guardian recommends a [MAJOR|MINOR|PATCH] bump. Current version is X.X.X → X.X.X. Should I update package.json files?"

## Output format

```
## Release Check Report

### 🔴 Release Blockers
[Anything that must be fixed before publishing]

### 🟡 Warnings
[Non-blocking issues to be aware of]

### TypeScript
✅ Clean / ❌ X errors

### Snapshot Tests
✅ No regressions / ❌ X snapshots changed (list them)

### Semver
Recommendation: [MAJOR | MINOR | PATCH]
Current: X.X.X → Proposed: X.X.X
Ready to update package.json? [yes/no]

### Agent Summary
- contract-guardian: ✅ / ❌
- framework-compliance: ✅ / ❌
- docs-mirror: ✅ / ❌
- vendor-boundary: ✅ / ❌
- dependency-auditor: ✅ / ❌
```

Do not publish or update versions without explicit user confirmation.
