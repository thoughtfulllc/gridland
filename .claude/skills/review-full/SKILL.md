---
name: review-full
description: Full review of changed files using all 5 agents in parallel — contract-guardian, framework-compliance, docs-mirror, vendor-boundary, dependency-auditor. Run before opening a PR.
---

Run a full review before opening a pull request. Spawn all 5 agents simultaneously as background subagents.

## Changed files

!`git diff --name-only HEAD`

## Agents to run in parallel

1. **contract-guardian** — breaking changes, semver, CLAUDE.md accuracy
2. **framework-compliance** — patterns, focus coverage, anti-patterns
3. **docs-mirror** — documentation accuracy, code example validity
4. **vendor-boundary** — SDK coupling, type leakage, part type correctness
5. **dependency-auditor** — external library usage vs official docs (goes online)

## Instructions

1. Spawn all 5 agents simultaneously as background agents
2. Pass the list of changed files to each
3. Wait for all to complete
4. Aggregate findings into a unified report:

```
## Full Review Report

### 🔴 Must Fix Before PR
[Critical findings from all agents]

### 🟡 Should Fix
[Warnings from all agents]

### 🔵 Notes
[Semver recommendation, CLAUDE.md updates, info-level findings]

### Agent Status
- contract-guardian: ✅ / ❌ X issues
- framework-compliance: ✅ / ❌ X issues
- docs-mirror: ✅ / ❌ X issues
- vendor-boundary: ✅ / ❌ X issues
- dependency-auditor: ✅ / ❌ X issues
```
