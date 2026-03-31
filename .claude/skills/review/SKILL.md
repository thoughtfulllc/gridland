---
name: review
description: Quick review of recently changed files. Runs contract-guardian and framework-compliance in parallel. Use after every significant edit before committing.
---

Run a quick review on recently changed files. Spawn **contract-guardian** and **framework-compliance** as parallel subagents.

## Changed files

!`git diff --name-only HEAD`

## Instructions

1. Spawn **contract-guardian** and **framework-compliance** simultaneously as background agents
2. Pass the list of changed files above to each
3. Wait for both to complete
4. Present their findings together, grouped by severity:
   - 🔴 Critical (breaking changes, missing focus coverage)
   - 🟡 Warning (violations, redundancies, naming issues)
   - 🔵 Info (semver recommendation, CLAUDE.md updates)

Keep the output concise — lead with what needs fixing now.

## After review

If any of the changed files introduced a new component, changed a prop signature, added a pattern, or made a non-obvious design decision — prompt the user:

> "Changes look good. If you made any design decisions worth preserving (new component, changed API, non-obvious choice), run `/sync-context` to update CLAUDE.md before committing."

Skip this prompt if the changes were purely mechanical (typo fix, rename, test update).
