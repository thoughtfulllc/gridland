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
   - `useKeyboard` JSDoc references `@gridland/utils` (not `@opentui/react` or internal paths)
   - Generic type parameters: if compared by `===` or `Set.has`, document the equality constraint (primitives recommended) or add a type bound
   - Controlled/uncontrolled: if both modes are supported, warn on mode switching (check for `useRef` guard)

2. **Keyboard handler correctness**
   - Values read inside `useKeyboard` handler that change between renders should use refs (cursor position, selected state, submitted flag)
   - Verify the handler reads from refs for rapidly-changing state and closure-captures for stable props (consistent with SelectInput/PromptInput pattern)
   - All keyboard bindings documented in the Controls section of the docs
   - **Dead handlers**: Flag any `useKeyboard`, `useCallback`, or `useEffect` whose body is empty or contains only a guard clause (`if (disabled) return`) with no actual logic. These are no-ops that bloat the component and mislead readers

3. **Theme compliance**
   - No hardcoded hex colors — all colors from `useTheme()` or props
   - Uses `textStyle()` for bold/dim/inverse (never raw style keys)

4. **Export registration**
   - Both runtime and type exports in `packages/ui/components/index.ts`
   - Listed in `packages/ui/CLAUDE.md` component catalog

5. **Unnecessary indirection**
   - Flag `useCallback` wrappers that just forward to a prop callback with no transformation (e.g., `useCallback((v) => { onChange?.(v) }, [onChange])`). Pass the prop directly instead
   - Flag intermediary state or refs that serve no purpose after a refactor (e.g., leftover `isControlled` guards after removing uncontrolled mode)

### P1 — Significant (should fix)

6. **Performance**
   - `useMemo` for expensive derived state (Set creation from arrays, flatMap operations)
   - `useMemo` dep arrays are correct (no missing deps, no over-deps)
   - No unnecessary allocations in the render path (e.g., `new Set()` on every render)

7. **React key stability**
   - Keys in `.map()` calls are stable across re-renders
   - Scroll-windowed lists use absolute indices, not relative window indices
   - Group/separator keys won't collide

8. **Edge cases**
   - Empty items array handled gracefully
   - Single item works
   - Disabled state blocks all interaction
   - Component handles controlled prop changes (re-render sync)
   - Cursor/index clamping when list size changes

### P2 — Polish (nice to have)

9. **Test coverage by code path**
    - For each conditional branch in the render function, verify a corresponding test exists. Enumerate branches explicitly: disabled rendering, focused vs unfocused, label present vs absent, error vs description vs neither, empty value vs filled, maxLength counter shown vs hidden
    - No duplicate tests (same setup + assertions)
    - Shared test helpers for repeated patterns (e.g., mock keyboard setup)
    - Test file has `// @ts-nocheck` if using OpenTUI intrinsics
    - Tests run with `--preload ../web/test/preload.ts`

10. **Documentation — code examples are valid**
    - Every fenced code block in the MDX must pass all required props and use correct prop names. Cross-reference the component's Props interface with each example. A user who copies any example should get zero TypeScript errors
    - If a prop was recently made required or removed, check every example — not just the main usage block

11. **Documentation — prose matches implementation**
    - The page description, section headings, and explanatory copy must accurately reflect the current API. If the component was refactored (e.g., uncontrolled removed, prop renamed, mode dropped), the narrative must match
    - Check for stale references to removed concepts (e.g., "controlled/uncontrolled modes" after uncontrolled was removed)

12. **Documentation — API table and controls**
    - API reference table matches current props (no missing, no stale, correct defaults)
    - Controls section lists all keyboard bindings
    - `errorMessage` or similar customization props are documented

13. **Demo validity**
    - The demo file and docs demo wrapper must pass all required props for every state/variant rendered. If a prop was made required, verify every demo usage — not just the main demo
    - Demo state arrays (pickers, variant lists) must provide required props or the parent must supply defaults

## Phase 4 — Cross-reference with sibling components

Read the equivalent sibling component (e.g., if reviewing MultiSelect, read SelectInput) to verify:
- Pattern consistency (same reducer style, same keyboard handling approach, same ref usage)
- Consistent prop naming (e.g., both use `useKeyboard`, `onSubmit`, `disabled`)
- No divergence that would confuse framework consumers

## Phase 5 — Produce report and fix plan

Output a structured report:

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
