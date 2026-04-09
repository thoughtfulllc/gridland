---
name: sync-context
description: Update context files to reflect current codebase state — new components, changed APIs, new patterns, and reasoning behind non-obvious decisions. Routes updates to the correct file based on what changed. Run after any significant design change before committing.
---

Update context files to reflect the current state of the codebase.

## Step 1 — Gather what changed

```bash
git diff HEAD
git log --oneline -10
git diff HEAD --name-only | grep -E '\.(tsx|ts)$'
```

## Step 2 — Classify each change and route to the correct file

| Change type | Target file |
|---|---|
| New component, removed component, changed component props | `packages/ui/CLAUDE.md` (component catalog table) |
| New focus pattern, focus anti-pattern, useFocus API change | `.claude/rules/focus-system.md` |
| New AI SDK convention, changed part types or states | `.claude/rules/ai-sdk.md` |
| New layout rule, intrinsic element, borderStyle | `.claude/rules/opentui-layout.md` |
| Non-obvious design decision worth preserving | `.claude/rules/design-decisions.md` |
| New docs convention, demo pattern | `packages/docs/CLAUDE.md` |
| New universal anti-pattern, import rule, test command | Root `CLAUDE.md` |

## Step 3 — For each update, evaluate

- Is this new or already documented? (Don't duplicate)
- Is the "why" non-obvious? (Only document if a future engineer might undo without understanding)
- Is existing documentation still accurate? (Update or remove stale entries)
- Is this a permanent pattern or temporary workaround? (Only document permanent)

## Step 4 — Apply updates

Read the target file, then edit it following the existing format:
- Component catalog: add/update row in the table
- Rules: add section or update existing content
- Anti-patterns: add `- ` bullet item
- Design decisions: add `## ` section with rationale

## Step 5 — Verify

- Root `CLAUDE.md` must stay under 100 lines
- No duplicate information across files
- All updated files have correct content

## What NOT to add

- Implementation details that belong in code comments
- Tutorials or guides
- Obvious decisions that don't need rationale
- Bug workarounds or version-specific notes
- Anything derivable from reading the code directly
