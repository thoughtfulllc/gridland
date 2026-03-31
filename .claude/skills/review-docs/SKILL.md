---
name: review-docs
description: Documentation-focused review. Runs docs-mirror and dependency-auditor in parallel. Use after writing or updating documentation, demo components, or MDX pages.
---

Run a documentation review. Spawn **docs-mirror** and **dependency-auditor** as parallel background agents.

## Changed files

!`git diff --name-only HEAD`

## Focus

If no argument is passed, review all changed files. If a specific component or path is provided as `$ARGUMENTS`, focus the review there:

> Reviewing: $ARGUMENTS

## Instructions

1. Spawn **docs-mirror** and **dependency-auditor** simultaneously as background agents
2. docs-mirror: verify props documented, code examples valid, demos exist and correct
3. dependency-auditor: verify external library usage in examples matches official docs
4. Present combined findings:

```
## Documentation Review

### ❌ Prop/Type Mismatches
[Props in docs that don't match implementation]

### ❌ Invalid Code Examples
[Examples with wrong imports, removed props, anti-patterns]

### ❌ Missing or Stale Docs
[Components without docs, docs for removed components]

### ❌ External API Issues
[SDK usage in examples that doesn't match official docs]

### ✅ All Clear
[Components with accurate, valid documentation]
```
