---
name: review-docs
description: Documentation-focused review. Runs docs-mirror and dependency-auditor in parallel. Use after writing or updating documentation, demo components, or MDX pages.
---

Documentation-focused review after writing or updating docs.

1. Get the list of changed files:
```bash
git diff --name-only HEAD
```

2. If `$ARGUMENTS` provided, focus review on those files. Otherwise review all changed files.

3. Spawn `docs-mirror` and `dependency-auditor` simultaneously as background agents.
   - docs-mirror: verify props documented, code examples valid, demos exist and correct
   - dependency-auditor: verify external library usage in examples matches official docs

4. Wait for both agents to complete.

5. Present combined findings:
   - Prop/Type Mismatches
   - Invalid Code Examples
   - Missing or Stale Docs
   - External API Issues
   - All Clear (if no issues)
