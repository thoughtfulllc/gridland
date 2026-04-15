# Task 006: KeyEvent JSDoc + useKeyboard Worked Example

> Split from `tasks/004-types-and-docs-gap.md` — this was T3 of the original bundle. Launch-priority #2 per the CTO review: cheap, zero runtime risk, every user writing their first keyboard handler benefits within five minutes.

## Summary

`KeyEvent` at `packages/core/src/lib/KeyEvent.ts` has zero JSDoc on its public fields. Hovering any field in VS Code shows nothing; users cannot answer "when do I read `name` vs `sequence`?" without grepping compiled JS. Add a one-line JSDoc comment to every field, document `preventDefault` / `stopPropagation` with honest propagation semantics (see Open Question below — this is a pre-PR blocker), and extend `packages/docs/content/docs/hooks/use-keyboard.mdx` with a worked example showing which field to read for each key category.

## Motivation

First-hour adopter evaluation flagged that `KeyEvent`'s field set is not self-explanatory — some fields are Kitty-protocol-only, `name` vs `sequence` has subtle rules around printable punctuation, and `ctrl` / `meta` / `super` are independent flags with platform-specific meaning. JSDoc is the correct fix because IDE hover is where users look first. Zero runtime cost; IDE intellisense is user-observable so a patch bump applies.

## Success Criteria

1. Every public field of `KeyEvent` at `packages/core/src/lib/KeyEvent.ts` has a one-line JSDoc comment that answers "when do I use this field?".
2. `preventDefault` and `stopPropagation` have JSDoc that accurately describes the propagation model — grounded in the actual dispatcher code, not a draft copied from the original ticket. See Open Question below.
3. Hovering `KeyEvent.name` (and any other field) in VS Code surfaces the new JSDoc.
4. `packages/docs/content/docs/hooks/use-keyboard.mdx` includes:
   - A complete `KeyEvent` reference table covering every field of the class (replacing the existing minimal table).
   - A "Which field should I read?" worked example demonstrating the blessed reading rules (letter + modifier via `name` + `ctrl`; arrows via `name`; function keys via `name`; printable punctuation via `sequence`).
5. `bun run --cwd packages/docs build` passes with no MDX errors.
6. **Semver + CHANGELOG:** `@gridland/utils` — **patch bump.** `KeyEvent` gains JSDoc (no runtime change) but IDE intellisense surfaces change, which is user-observable.

## Architecture Context

### Files involved

| Path | Role |
|---|---|
| `packages/core/src/lib/KeyEvent.ts` | Defines the `KeyEvent` class. Re-exported from `@gridland/utils` (`packages/utils/src/index.ts:63`). Currently zero JSDoc. |
| `packages/core/src/lib/parse.keypress.ts` | Defines `ParsedKey` and populates the fields. Source of truth for when `name` vs `sequence` is set. |
| `packages/core/src/lib/KeyHandler.ts` | Kitty-protocol parser. Source of truth for which fields are Kitty-only. |
| `packages/core/src/react/focus/focus-provider.tsx` | Focus-aware key dispatch into scoped listeners. One of three places where `propagationStopped` might be checked. |
| `packages/core/src/react/hooks/use-keyboard.ts` | Consumer wrapper at lines 56-86; decides which handler fires based on focus/selection. |
| `packages/docs/content/docs/hooks/use-keyboard.mdx` | **This file exists already** (74 lines as of 2026-04-15). Has a Parameters table and a minimal KeyEvent table. Extend — do not create a new page under `api/`. |

### Why JSDoc on `KeyEvent` matters more than on other classes

`KeyEvent` fields split into three groups with different contracts:
- **Always populated:** `name`, `ctrl`, `meta`, `shift`, `option`, `sequence`, `number`, `raw`, `eventType`, `source`.
- **Kitty-protocol only** (terminal support varies): `code`, `super`, `hyper`, `capsLock`, `numLock`, `baseCode`, `repeated`.
- **Contract-sensitive:** `name` is set for letters / arrows / function keys but **not** for printable punctuation like `[` / `]` / `;` / `/` — those only populate `sequence`. Readers who don't know this end up with handlers that silently never fire.

None of this is discoverable from the type alone; JSDoc is the only place to document it.

## Steps

1. **Verify the field set and contract rules** by reading, in order:
   - `packages/core/src/lib/KeyEvent.ts` (the class itself — has the current fields drifted from the list in Architecture Context?).
   - `packages/core/src/lib/parse.keypress.ts` (`ParsedKey` definition and where `name` / `sequence` are populated — confirm the "name not set for printable punctuation" rule).
   - `packages/core/src/lib/KeyHandler.ts` (Kitty-protocol parser — confirm which fields are Kitty-only).

   Do not write JSDoc until every claim in your draft can be cited to a file:line. If a claim turns out to be wrong, rewrite that line — do not copy the draft from the archived `tasks/004-types-and-docs-gap.md` §Ticket 3 verbatim.

2. **Add one-line JSDoc comments to every field of the `KeyEvent` class.** The block below is a **draft** inherited from the archived bundle — verify each line before shipping:

   ```ts
   export class KeyEvent implements ParsedKey {
     /** Logical key name: `"a"`, `"left"`, `"f1"`, `"escape"`, `"return"`. Prefer this over `sequence` for letter, modifier, arrow, and function keys. Not set for printable punctuation — use `sequence` for those. */
     name: string
     /** True if the literal Ctrl key was held. Ctrl and Meta are independent flags; do not treat them as cross-platform equivalents. */
     ctrl: boolean
     /** True if Meta was held (Command on macOS, Windows key on Windows, Super on Linux). Independent of `ctrl`. */
     meta: boolean
     /** True if Shift was held. */
     shift: boolean
     /** True if Option (Mac) / Alt was held. */
     option: boolean
     /** Raw byte sequence the terminal emitted. Use this for printable punctuation like `"["`, `"]"`, `";"`, `"/"` where `name` is not set. */
     sequence: string
     /** True if the key is a number (0-9). */
     number: boolean
     /** Unescaped raw input — the literal bytes before parsing. Rarely needed; prefer `sequence` or `name`. */
     raw: string
     /** Event type: `"press"`, `"release"`, or `"repeat"`. Only non-`"press"` if running under a terminal that supports Kitty keyboard protocol. */
     eventType: KeyEventType
     /** How this event was parsed: `"raw"` = legacy xterm decoding, `"kitty"` = Kitty keyboard protocol (richer data). */
     source: "raw" | "kitty"
     /** Kitty-only: physical key code (e.g. US-layout `"KeyA"`). Use `name` unless you specifically need layout-independent identification. */
     code?: string
     /** Kitty-only: true if Super / Windows / Command was held. */
     super?: boolean
     /** Kitty-only: true if Hyper was held. */
     hyper?: boolean
     /** Kitty-only: true if Caps Lock was on. */
     capsLock?: boolean
     /** Kitty-only: true if Num Lock was on. */
     numLock?: boolean
     /** Kitty-only: base key code without modifiers. */
     baseCode?: number
     /** Kitty-only: true if this is a key-repeat event. */
     repeated?: boolean
   ```

3. **Document `preventDefault` and `stopPropagation`** on `KeyEvent` (currently at lines 55-61) with *accurate* propagation semantics. **This is the pre-PR blocker — see Open Question below.** The `_propagationStopped` flag exists on the class at `packages/core/src/lib/KeyEvent.ts:25`; whether it is honored is decided by the dispatcher. Find the reader (or prove there is none) before writing the JSDoc. Draft to rewrite based on findings:

   ```ts
   /** Prevents the framework's default handling for this key event (e.g. blocks built-in focus navigation on Tab). Does not stop other listeners from firing. */
   preventDefault(): void

   /** <If a reader exists:> Stops this event from propagating to <ancestor|sibling> listeners. Sibling listeners on the same focus id <do/do not> still fire.
    *  <If no reader exists:> Sets a flag that framework listeners do not currently check. Exists for forward compatibility. */
   stopPropagation(): void
   ```

4. **Replace the minimal `KeyEvent` table in `packages/docs/content/docs/hooks/use-keyboard.mdx`** with a complete one covering every field of the class. Match the JSDoc wording from Step 2 — do not drift between the IDE and the docs.

5. **Add a "Which field should I read?" worked example** to the same MDX file:

   ```tsx
   import { useKeyboard, type KeyEvent } from "@gridland/utils"

   useKeyboard((event: KeyEvent) => {
     // Letter with modifier → name + ctrl
     if (event.name === "s" && event.ctrl) save()

     // Arrow keys and named keys → name
     if (event.name === "left") prevItem()
     if (event.name === "escape") closeModal()

     // Function keys → name
     if (event.name === "f1") showHelp()

     // Printable punctuation → sequence
     if (event.sequence === "[") prevPage()
     if (event.sequence === "]") nextPage()
   })
   ```

   Note: the example uses the bare `useKeyboard(handler)` form. After `tasks/008-bless-usekeyboard-global.md` lands, open a follow-up to update this example to `{ global: true }`.

## Verification

```bash
bun run --cwd packages/docs build   # must pass, no MDX errors
bun run --cwd packages/utils test   # re-exports still resolve; no runtime drift

# Manual
# 1. Open packages/core/src/lib/KeyEvent.ts in VS Code. Hover over `name`, `sequence`, `code`, `super`. Confirm JSDoc surfaces.
# 2. Open the built docs site at /docs/hooks/use-keyboard. Confirm the KeyEvent reference table is complete and the worked example renders.
# 3. Search the docs site for "sequence" — the worked example block should surface in results.
```

## Done when

- Every field of `KeyEvent` has JSDoc that cites parse.keypress.ts / KeyHandler.ts behavior accurately (no Kitty claims on non-Kitty fields, no "always set" claims on `name`).
- `preventDefault` and `stopPropagation` JSDoc reflects the actual runtime behavior (Open Question 1 answered in the PR description with file:line citation).
- `use-keyboard.mdx` has the complete KeyEvent table and the worked example.
- `bun run --cwd packages/docs build` passes clean.
- `@gridland/utils` patch-bumped with a CHANGELOG entry.

## Open Questions

1. **[PRE-PR BLOCKER]** Does `KeyEvent.stopPropagation()` actually halt anything today, or is the flag set but never checked? Grep for `propagationStopped` and `_propagationStopped` across:
   - `packages/core/src/lib/KeyHandler.ts`
   - `packages/core/src/react/hooks/use-keyboard.ts`
   - `packages/core/src/react/focus/focus-provider.tsx`

   If no reader exists, the honest JSDoc is: *"Sets a flag that framework listeners do not currently check; exists for forward compatibility."* **Do not document propagation semantics that the runtime does not implement.** Cite file:line in the PR description for whichever answer is correct.

## References

- Original bundle (archived): `tasks/004-types-and-docs-gap.md` §Ticket 3.
- Companion docs ticket: `tasks/007-pointer-events-docs.md` (the pointer-events equivalent of this JSDoc effort).
- Deprecation follow-up: `tasks/008-bless-usekeyboard-global.md` (will update the worked example once `{ global: true }` is blessed).
