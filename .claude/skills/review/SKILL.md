---
name: review
description: Quick review of recently changed files. Runs contract-guardian and framework-compliance in parallel. Use after every significant edit before committing.
---

Quick review of recently changed files. Framework-compliance includes vendor boundary checks.

1. Get the list of changed files:
```bash
git diff --name-only HEAD
```

2. Spawn `contract-guardian` and `framework-compliance` agents simultaneously as background agents, passing the list of changed files.

3. Wait for both agents to complete.

4. Present findings grouped by severity:
   - Critical (breaking changes, missing focus coverage, vendor boundary issues)
   - Warning (violations, redundancies, naming issues)
   - Info (semver recommendation)

5. If changes introduced a new component, API, or pattern, suggest: "Run `/sync-context` to update context files before committing."

6. Skip the suggestion if changes were purely mechanical (typo, rename, test update).
