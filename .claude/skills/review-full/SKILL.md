---
name: review-full
description: Full review of changed files using all 4 agents in parallel — contract-guardian, framework-compliance, docs-mirror, dependency-auditor. Optionally includes layout-debugger for component changes. Run before opening a PR.
---

Full review of all changed files before opening a PR.

1. Get the list of changed files:
```bash
git diff --name-only HEAD
```

2. Spawn all 4 agents simultaneously as background agents:
   - `contract-guardian` — API changes and semver
   - `framework-compliance` — patterns, anti-patterns, vendor boundary
   - `docs-mirror` — documentation accuracy
   - `dependency-auditor` — external library usage

3. If changed files include component `.tsx` files in `packages/ui/components/`, also spawn `layout-debugger` to check for layout issues.

4. Wait for all agents to complete.

5. Aggregate into unified report:
   - Must Fix Before PR (critical findings from all agents)
   - Should Fix (warnings from all agents)
   - Notes (semver recommendation, info)
   - Agent Status (pass/fail + issue count for each)
