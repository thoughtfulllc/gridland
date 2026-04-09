---
name: release-check
description: Pre-release checklist. Runs all 4 agents plus snapshot regression test, TypeScript check, and semver confirmation. Run before publishing a new package version.
---

Pre-release checklist before publishing a new package version.

## Step 1 — Gather scope of changes

```bash
git diff --name-only $(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~10") HEAD
```

Get current versions:
```bash
grep '"version"' packages/ui/package.json packages/utils/package.json
```

## Step 2 — Run all 4 review agents

Spawn simultaneously as background agents:
- `contract-guardian` — API changes and semver recommendation
- `framework-compliance` — patterns, anti-patterns, vendor boundary
- `docs-mirror` — documentation accuracy
- `dependency-auditor` — external library usage

## Step 3 — TypeScript check

```bash
bun run --cwd packages/ui build 2>&1 | tail -30
bun run --cwd packages/utils build 2>&1 | tail -20
```

Flag any TypeScript errors as release blockers.

## Step 4 — Snapshot regression

```bash
bun run --cwd packages/ui test 2>&1 | tail -40
bun run --cwd packages/web test 2>&1 | tail -40
```

Report which snapshots changed. Ask for explicit confirmation before updating.

## Step 5 — Context files check

```bash
git diff HEAD -- CLAUDE.md packages/ui/CLAUDE.md packages/docs/CLAUDE.md .claude/rules/
```

If context files are out of date, warn and suggest running `/sync-context`.

## Step 6 — Aggregate and present

```
## Release Check Report

### Release Blockers
- [list of critical issues from all agents]
- [TypeScript errors]
- [Unexpected snapshot changes]

### Warnings
- [non-critical issues]

### TypeScript Status
- packages/ui: PASS/FAIL
- packages/utils: PASS/FAIL

### Snapshot Status
- Changed: [list] — need explicit confirmation
- Unchanged: [count]

### Semver Recommendation
**[MAJOR | MINOR | PATCH]** — based on contract-guardian findings
Current: X.X.X → Suggested: X.X.X

### Agent Summary
- contract-guardian: [pass/fail]
- framework-compliance: [pass/fail]
- docs-mirror: [pass/fail]
- dependency-auditor: [pass/fail]
```

**Do not publish or update versions without explicit user confirmation.**
