---
name: sync-context
description: >
  Update CLAUDE.md to reflect the current state of the codebase — new components,
  changed APIs, new patterns, and the reasoning behind non-obvious decisions.
  Run after any significant design change before committing.
---

You are updating `CLAUDE.md` so it accurately reflects the current codebase.
This file is the primary context document read by Claude at the start of every session.
It must stay truthful — an out-of-date CLAUDE.md is worse than no CLAUDE.md.

## Step 1 — Gather what changed

Run the following to understand what has changed since the last sync:

```bash
# Staged + unstaged changes
git diff HEAD

# Recent commits not yet captured (last 10)
git log --oneline -10

# New or modified component files
git diff HEAD --name-only | grep -E '\.(tsx|ts)$'
```

Also read `CLAUDE.md` in full so you know its current state.

## Step 2 — Identify update categories

For each changed file, classify the change:

| Category | What triggers it | Where it goes in CLAUDE.md |
|---|---|---|
| **New component** | New file in `packages/ui/components/` | Add row to UI Components table |
| **New hook or utility** | New export from `packages/utils/` | Add to Focus System → Core API |
| **Changed prop signature** | Existing component props added/removed/renamed | Update UI Components table |
| **New correct pattern** | A new canonical way to do something | Add to Correct Patterns block |
| **New anti-pattern** | A mistake that was caught and corrected | Add to Anti-Patterns list |
| **Non-obvious design choice** | A decision with a non-trivial reason | Add entry to Design Decisions |
| **Export convention change** | New export rule or index.ts pattern | Update Export Conventions |
| **AI SDK convention change** | New type name, part type, or import path | Update AI SDK Conventions |

## Step 3 — Evaluate each change carefully

For every change you plan to make to `CLAUDE.md`, ask:

- **Is this actually new, or is it already documented?** — Don't duplicate.
- **Is the "why" non-obvious?** — Only add a Design Decision entry if a future engineer
  might reasonably undo the choice without understanding its purpose. Don't document
  things that are self-evident from the code.
- **Is the existing documentation still accurate?** — If a prop was renamed or a default
  changed, update or remove the old entry. Stale docs are actively harmful.
- **Is this a temporary workaround or a permanent pattern?** — Only document permanent
  decisions. Workarounds should be tracked in issues, not CLAUDE.md.

## Step 4 — Write the updates

Edit `CLAUDE.md` directly. Follow the existing formatting exactly:
- Tables use `| Component | Key Props |` format with `---` separators
- Code blocks use triple backticks with `tsx` or `ts`
- Anti-patterns use `- ❌` prefix
- Design Decision entries follow this template:

```markdown
### <Short title — the decision, not the outcome>

<1-2 sentences: what the alternative was and why it was rejected, or what problem this solves>

<Optional: short code example showing the correct vs incorrect approach if it helps clarity>
```

## Step 5 — Sync to main repo

After updating `CLAUDE.md` in the worktree, also copy it to the main repo so it's
discoverable from either location:

```bash
cp /Users/jessicacheng/thoughtful/gridland/.claude/worktrees/nervous-mestorf/CLAUDE.md \
   /Users/jessicacheng/thoughtful/gridland/CLAUDE.md
```

## What NOT to add

- ❌ Implementation details that belong in code comments, not architecture docs
- ❌ Step-by-step tutorials — this is a reference doc, not a guide
- ❌ Decisions that are obvious from the component name or prop name
- ❌ Workarounds for bugs that will be fixed — track those in issues
- ❌ Version-specific notes (e.g., "in v2.3 we changed X") — CLAUDE.md reflects NOW
