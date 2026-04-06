---
name: production-ready
description: Review a component for production readiness as a UI framework. Assesses code quality, patterns, tests, docs, and API design. Produces a prioritized fix plan. Use before shipping a new or updated component to users.
---

Production-readiness review for a `@gridland/ui` component. Evaluates whether a component is ready to ship to framework consumers who will add it to their own repos.

The user may specify a component name (e.g., `/production-ready MultiSelect`) or you can infer it from recent changes. If ambiguous, ask.

## Phase 1 — Identify scope

Determine the target component and gather all relevant files:

```bash
# If no component specified, infer from recent changes
git diff --name-only HEAD
```

Read all files for the target component:
- `packages/ui/components/<name>/<name>.tsx` — implementation
- `packages/ui/components/<name>/*.test.tsx` — all test files
- `packages/docs/content/docs/components/<name>.mdx` — documentation
- `packages/demo/demos/<name>.tsx` — demo (if exists)
- `packages/docs/components/demos/<name>-demo.tsx` — docs demo wrapper (if exists)
- `packages/ui/registry/ui/<name>.tsx` — registry copy (must stay in sync with component source)
- `packages/ui/components/index.ts` — export barrel (grep for the component)

## Phase 2 — Architecture classification

First, separate the **primary component** from **companion demo utilities**. Files that exist to showcase or preview variants (e.g., SpinnerPicker, SpinnerShowcase) are demo utilities — not shipped components. Only apply the full P0–P2 checklist to the primary component. Demo utilities only need basic correctness (`// @ts-nocheck` if needed, no crashes). Do not review their docs, add Controls tables, or treat them as consumer-facing API.

Signs something is a demo utility:
- Named `*Picker`, `*Showcase`, `*Demo`
- Cycles through variants or displays all options side-by-side
- Used by `packages/demo/` or docs wrappers, not by consumers directly

Then classify the primary component. This is critical — the rules differ:

**Container components** (e.g., SideNav, Modal, ChatPanel) manage their own focus scope. They MUST:
- Call `useFocus` and attach `focusRef`
- Wrap content in `FocusScope` with `selectable`
- Register shortcuts with `useShortcuts`
- Use `useFocusBorderStyle` or `useFocusDividerStyle` for visual affordance

**Embedded components** (e.g., SelectInput, MultiSelect, PromptInput) receive `useKeyboard` as a prop and are focus-managed by a parent. They do NOT call `useFocus`, `focusRef`, `FocusScope`, or `useShortcuts`. This is intentional — not a gap.

**How to tell:** If the component accepts a `useKeyboard` prop and calls `useKeyboardContext(useKeyboardProp)`, it is embedded. If it imports `useFocus` from `@gridland/utils`, it is a container.

**Static components** (e.g., Spinner, Ascii, Table) have no keyboard interaction. Focus rules don't apply.

## Phase 3 — Code review

Check the implementation against these criteria, ordered by severity:

### P0 — Blocking (must fix before shipping)

1. **API correctness for framework consumers**
   - Props interface has JSDoc on every prop
   - Exported types are useful (not leaking internals)
   - Types that users need to work with the component API (data constraints, item shapes, column info) are exported from `index.ts` — check that every `interface` or `type` used in public props or utility function signatures is re-exported
   - **Dead fields in exported types**: For each exported `interface`/`type`, verify every field is consumed by at least one component prop or internal logic path. Fields that exist in a data type but are never read by any component (e.g., a `tool` field on a step data type that no component renders) are dead API surface — they mislead consumers into thinking the field has an effect. Also check that type names are specific enough to avoid collisions (e.g., `Step` is too generic — prefer `ChainOfThoughtStepData`)
   - `useKeyboard` JSDoc references `@gridland/utils` (not `@opentui/react` or internal paths)
   - Generic type parameters: if compared by `===` or `Set.has`, document the equality constraint (primitives recommended) or add a type bound
   - Controlled/uncontrolled: if both modes are supported, warn on mode switching (check for `useRef` guard)
   - **Controllable state correctness**: If a component accepts `open`/`defaultOpen`/`onOpenChange` (or any `value`/`defaultValue`/`onChange` triplet), trace ALL four prop combinations: (1) controlled only (`open`), (2) uncontrolled only (`defaultOpen`), (3) uncontrolled + callback (`defaultOpen` + `onOpenChange`), (4) controlled + callback (`open` + `onOpenChange`). For each, verify the callback fires AND internal state updates correctly. The pattern `const setter = onChangeCallback ?? setInternalState` is a known anti-pattern — it replaces the internal state updater with the callback instead of doing both. The correct pattern calls `onChangeCallback?.()` alongside `setInternalState()` (see Radix `useControllableState` for reference)
   - **Async callback contracts**: If a callback prop (e.g., `onSubmit`) accepts `Promise<void>` return types, trace the actual code path. Verify that documented semantics match implementation — e.g., if JSDoc says "clears on resolve, preserves on reject," confirm input is NOT cleared before the promise starts, only in the `.then()` resolve path. State mutations before `await`/`.then()` defeat the async contract
   - **Silent error swallowing**: If a Promise `.catch` or reject handler is empty or has only a comment, flag it. Errors should be surfaced via an `onError` callback or equivalent — silent swallowing hides failures from consumers

2. **Keyboard handler correctness**
   - Values read inside `useKeyboard` handler that change between renders should use refs (cursor position, selected state, submitted flag)
   - Verify the handler reads from refs for rapidly-changing state and closure-captures for stable props (consistent with SelectInput/PromptInput pattern)
   - All keyboard bindings documented in the Controls section of the docs
   - **Dead handlers**: Flag any `useKeyboard`, `useCallback`, or `useEffect` whose body is empty or contains only a guard clause (`if (disabled) return`) with no actual logic. These are no-ops that bloat the component and mislead readers
   - **Duplicated handler logic**: If the component has multiple code paths handling the same keys (e.g., a focused `<input>` path and an unfocused `useKeyboard` fallback), verify the logic is shared via a single function — not copy-pasted. Duplicated branches diverge silently over time

3. **`// @ts-nocheck` on component files using intrinsics**
   - If the component file uses OpenTUI intrinsic elements (`<box>`, `<text>`, `<span>`), it must have `// @ts-nocheck` at line 1
   - Also check the registry copy at `packages/ui/registry/ui/<name>.tsx`

4. **Theme compliance**
   - No hardcoded hex colors — all colors from `useTheme()` or props
   - Uses `textStyle()` for bold/dim/inverse (never raw style keys)

5. **Export registration**
   - Both runtime and type exports in `packages/ui/components/index.ts`
   - Listed in `packages/ui/CLAUDE.md` component catalog

6. **Registry sync**
   - `packages/ui/registry/ui/<name>.tsx` must match the component source — diff the two files and flag any drift
   - Registry files are auto-generated by `packages/ui/scripts/build-registry.ts`. Never edit them manually. If drift is found, regenerate: `bun run --cwd packages/ui build:registry`
   - After any component source change, regenerate and verify the registry output matches

7. **Unnecessary indirection**
   - Flag `useCallback` wrappers that just forward to a prop callback with no transformation (e.g., `useCallback((v) => { onChange?.(v) }, [onChange])`). Pass the prop directly instead
   - Flag intermediary state or refs that serve no purpose after a refactor (e.g., leftover `isControlled` guards after removing uncontrolled mode)

### P1 — Significant (should fix)

8. **Performance**
   - `useMemo` for expensive derived state (Set creation from arrays, flatMap operations)
   - `useMemo` dep arrays are correct (no missing deps, no over-deps)
   - No unnecessary allocations in the render path (e.g., `new Set()` on every render)

9. **React key stability**
   - Keys in `.map()` calls are stable across re-renders
   - Scroll-windowed lists use absolute indices, not relative window indices
   - Group/separator keys won't collide

10. **Edge cases**
   - Empty items array handled gracefully
   - Single item works
   - Disabled state blocks all interaction
   - Component handles controlled prop changes (re-render sync)
   - Cursor/index clamping when list size changes
   - **Extension point edge cases**: When a component offers override callbacks (e.g., `getSuggestions`, custom renderers), trace what happens when the override returns values that differ from built-in assumptions. For example, if the default path assumes a trigger character like `@`, verify the custom path still works with a different trigger. Hardcoded `lastIndexOf("@")` or similar assumptions that break custom usage are P1 bugs

### P2 — Polish (nice to have)

11. **Test coverage by code path**
    - For each conditional branch in the render function, verify a corresponding test exists. Enumerate branches explicitly: disabled rendering, focused vs unfocused, label present vs absent, error vs description vs neither, empty value vs filled, maxLength counter shown vs hidden
    - No duplicate tests (same setup + assertions)
    - Shared test helpers for repeated patterns (e.g., mock keyboard setup)
    - Test file has `// @ts-nocheck` if using OpenTUI intrinsics
    - Tests run with `--preload ../web/test/preload.ts`
    - **Assertion-less tests**: Flag any `it()` block that has no `expect()` call or where the assertion doesn't actually verify the behavior described in the test name. A test named "preserves input on reject" must assert the input value, not just run through the flow
    - **Tests that document bugs**: Flag tests where comments explain why the behavior is wrong or surprising instead of testing the intended behavior. Tests should assert correct behavior — if a code path is buggy, fix the code, don't write a test that explains the bug

12. **Documentation — code examples are valid**
    - Every fenced code block in the MDX must pass all required props and use correct prop names. Cross-reference the component's Props interface with each example. A user who copies any example should get zero TypeScript errors
    - If a prop was recently made required or removed, check every example — not just the main usage block

13. **Documentation — prose matches implementation**
    - The page description, section headings, and explanatory copy must accurately reflect the current API. If the component was refactored (e.g., uncontrolled removed, prop renamed, mode dropped), the narrative must match
    - Check for stale references to removed concepts (e.g., "controlled/uncontrolled modes" after uncontrolled was removed)

14. **Documentation — API table and controls**
    - API reference table matches current props (no missing, no stale, correct defaults)
    - Controls section lists all keyboard bindings
    - `errorMessage` or similar customization props are documented

15. **Documentation — example coverage**
    - Every non-trivial prop (anything beyond `children` and standard layout props) should have a corresponding fenced code example in the MDX
    - If a feature exists but has no example, users won't discover it — flag it

16. **Demo validity and feature coverage**
    - The demo file and docs demo wrapper must pass all required props for every state/variant rendered. If a prop was made required, verify every demo usage — not just the main demo
    - Demo state arrays (pickers, variant lists) must provide required props or the parent must supply defaults
    - The demo should showcase the component's **key features**, not just render a basic default instance. Check that distinctive props (alignment, color overrides, colSpan, compound sub-components like Footer/Caption) appear in at least one demo variant. A demo that only shows the default configuration is incomplete

## Phase 4 — Cross-reference with sibling components, shadcn, and ai-elements

Read the equivalent sibling component (e.g., if reviewing MultiSelect, read SelectInput) to verify:
- Pattern consistency (same reducer style, same keyboard handling approach, same ref usage)
- Consistent prop naming (e.g., both use `useKeyboard`, `onSubmit`, `disabled`)
- No divergence that would confuse framework consumers

If the component has a shadcn/ui equivalent (Table, Tabs, Select, Modal/Dialog, etc.), compare API expressiveness:
- For each common use case of that component type, can users achieve it with the current props?
- Examples: right-aligning a column, coloring a status cell, spanning columns, disabling a row
- Flag major expressiveness gaps where shadcn users would expect functionality that Gridland doesn't offer
- This is about API design quality, not HTML/CSS parity — adapt the comparison to what makes sense for TUI

If the component has an equivalent in `ai-elements` (at `/Users/jessicacheng/thoughtful/ai-elements`), do a line-by-line comparison:
- **State management**: How does ai-elements handle controllable state? If it uses `useControllableState` or similar, compare the implementation logic — not just the prop names. Different solutions to the same problem often reveal bugs in one version
- **Exported types**: Compare field-by-field. If ai-elements doesn't have a field that Gridland exports, ask whether that field is actually consumed by any component code. Dead fields are a sign of speculative API design
- **Sub-components**: Are there compound subcomponents (Footer, Tools, ActionMenu) that Gridland is missing for common use cases? For browser-only sub-components (images, badges, click handlers), verify that Gridland's `children` prop covers the same use case in TUI
- **Status/enum values**: Compare status strings (e.g., `"complete"` vs `"done"`, `"active"` vs `"running"`). Flag any difference as either a deliberate divergence (document why) or an accidental drift
- **Prop abstractions**: If ai-elements doesn't require a prop that Gridland does (e.g., `isLast` for step connectors), investigate how ai-elements avoids it — the Gridland version may have a leaky abstraction
- Flag gaps as API design suggestions (P2), not blockers — TUI and web have different requirements

## Phase 5 — Draft report (internal, do NOT present yet)

Draft the report internally. Do NOT show the user anything yet — you must self-verify first (Phase 6).

## Phase 6 — Self-verification (REQUIRED before presenting)

This phase exists because issues repeatedly slip through single-pass reviews. You MUST complete every step below before presenting the report to the user. The goal is to catch everything in ONE run.

### Step 1: Checklist audit

Walk through EVERY numbered item in the Phase 3 checklist (1–16) and confirm each one was actually checked against the code. For each item, write a one-line internal note:
- `[checked — pass]` or `[checked — FAIL: <issue>]` or `[N/A — <reason>]`

If any item shows `[not checked]`, go back and check it now. Do not skip items because they "probably" pass.

### Step 2: Re-read the source file

Re-read the component source file (`packages/ui/components/<name>/<name>.tsx`) one more time. On this read-through, focus specifically on:
- Every `interface` and `type` — are they all exported from `index.ts`? Including props types for sub-components?
- Every prop — does it have JSDoc? Is it in the docs API table?
- Every conditional branch — is there a test for it?
- Every `useMemo`/`useCallback`/`useEffect` — correct deps?
- Any inline prop types (e.g., `{ children: ReactNode }`) that should be named interfaces?

### Step 3: Cross-check exports

Run this verification:
1. List every `export` in the component source file
2. For each export, grep `packages/ui/components/index.ts` to confirm it's re-exported
3. For each exported `type`/`interface`, confirm it has a `export type { ... }` line in `index.ts`
4. Flag any export that exists in the source but not in `index.ts`

### Step 4: Cross-check docs against code

For each prop in the component's `Props` interface:
1. Verify it appears in the docs API Reference table with the correct type, default, and description
2. Verify at least one code example uses it (for non-trivial props)

For each code example in the docs:
1. Verify the imports are valid (exist in `index.ts`)
2. Verify all required props are passed
3. Verify no removed/renamed props are used

### Step 5: Verify fix plan completeness

For every issue found (P0, P1, P2):
1. Confirm the fix plan has a concrete action item with a file path
2. Confirm the fix plan actions will actually resolve the issue (not just describe it)

### Step 6: Final gate

Ask yourself: "If I run `/production-ready <component>` again after these fixes, will I find zero new issues?" If the answer is no, you missed something — go back and find it.

## Phase 7 — Present report

Only after completing Phase 6, output the final report:

```
## Production Readiness: <ComponentName>

### Architecture: [Container | Embedded | Static]

### P0 — Blocking
- [file:line] Issue — what to fix

### P1 — Significant
- [file:line] Issue — what to fix

### P2 — Polish
- [file:line] Issue — what to fix

### Passing
- [list of checks that passed]

### Fix Plan
Ordered list of changes to make, with file paths and what to change.
Estimated scope: [trivial | small | medium | large]
```

After presenting the report, ask: "Want me to make these fixes?"

## Important guidance

- Do NOT flag missing focus integration on embedded components — this is by design.
- Do NOT flag stale closures on stable props (disabled, maxCount, etc.) in keyboard handlers — this is the standard pattern across all components.
- Do NOT flag the `--update-snapshots` test script — that's a repo-wide issue, not component-specific.
- DO compare against sibling components to calibrate expectations. If SelectInput does something the same way, it's a pattern, not a bug.
- DO think from the perspective of a developer adding this component to their project via the framework. What will confuse them? What will break silently?
