# Task 007: Pointer Events as a First-Class Docs Page

> Split from `tasks/004-types-and-docs-gap.md` — this was T4 of the original bundle. Launch-priority #3 per the CTO review: pure docs, low risk, matters more for launch marketing than for users actively building, but fixes a real search-discoverability gap.

## Summary

Pointer event documentation lives in `packages/docs/content/docs/guides/focus-and-navigation.mdx:~290-303` — a section buried inside an unrelated guide. Searching the docs site for "click", "mouse", or "pointer" surfaces nothing useful. Create `packages/docs/content/docs/guides/pointer-events.mdx` as a standalone guide, add it to the sidebar, thin the duplicate section in `focus-and-navigation.mdx` to a one-paragraph link, and cross-link from `components/primitives.mdx`.

## Motivation

First-hour adopter evaluation flagged that pointer events are effectively undocumented from a search-discoverability standpoint. A motivated user can find the buried section, but the evaluator correctly pointed out that "not search-indexed by the user's most likely terms" and "not documented" are practically equivalent for a first-hour adopter.

## Scope

**In scope:** new MDX page, sidebar config update, thin the duplicate in `focus-and-navigation.mdx`, cross-link from `primitives.mdx`.

**Out of scope:**
- Typing the pointer event props (deferred to `tasks/backlog/pointer-event-types.md`). This ticket documents behavior that exists at runtime today; it does **not** depend on new exported types. If a `GridlandPointerEvent` type is not yet exported from `@gridland/web`, the MDX code blocks should reference the runtime shape inline (not `import type` it) and add a note that a named exported type is coming in a future release.
- Auto-generated prop reference.
- Auditing all demos for pointer-event usage.

## Success Criteria

1. `packages/docs/content/docs/guides/pointer-events.mdx` exists and renders without MDX errors.
2. The Guides sidebar in the built docs site shows a "Pointer Events" entry.
3. Searching the built docs site for "click", "mouse", or "pointer" surfaces the new page.
4. `packages/docs/content/docs/components/primitives.mdx` contains a visible cross-link to the new page, placed above the first element table.
5. `packages/docs/content/docs/guides/focus-and-navigation.mdx` no longer contains a full pointer-events reference table — it has a one-paragraph summary and a link to the new page.
6. `bun run --cwd packages/docs build` passes with no broken-link warnings.
7. `rg "TODO" packages/docs/content/docs/guides/pointer-events.mdx` returns zero hits. No `TODO` strings land in published MDX.
8. **Semver + CHANGELOG:** no package bump required (docs-site content only, and the docs site is not a published package). If a CHANGELOG exists for `packages/docs`, add an entry; otherwise skip.

## Architecture Context

### Files involved

| Path | Role |
|---|---|
| `packages/docs/content/docs/guides/pointer-events.mdx` | **To create.** New standalone guide. |
| `packages/docs/content/docs/guides/focus-and-navigation.mdx` | Currently contains the full pointer-events reference at lines ~290-303. Thin to a summary + link. |
| `packages/docs/content/docs/guides/meta.json` | Fumadocs sidebar ordering config for the Guides section. Add `"pointer-events"` near `"focus-and-navigation"`. |
| `packages/docs/content/docs/components/primitives.mdx` | Documents intrinsic elements. Add a cross-link callout above the first element table. |
| `packages/web/src/browser-renderer.ts` | Lines 335-366 — `createTuiMouseEvent`. Authoritative shape of the runtime event object. |
| `packages/core/src/Renderable.ts` | Lines 113-123 — 11 handler props. Lines 1468-1536 — `processMouseEvent` dispatcher. |
| `packages/core/src/lib/parse.mouse.ts` | `MouseEventType` literal union. |

### Pre-write verification (do NOT skip)

**This ticket documents runtime behavior, so every claim in the MDX must be verified against source before shipping.** The `.claude/rules/opentui-event-dispatch.md` rule file will auto-load when you touch `packages/web/src/browser-renderer.ts` — read it before writing any event-shape documentation. Key surprises the rule documents and that the MDX must reflect accurately:

- `x` / `y` are **cell coordinates, not pixels** (translated via `pixelToCell`).
- Scroll payload is `{ direction, delta }`, **not** DOM-style `{ deltaX, deltaY }`.
- `onClick` handlers receive `type: "down"` (not `"click"`) — quirk of the click synthesizer at `browser-renderer.ts:249`.
- No `timestamp`, `nativeEvent`, `clientX`, or `clientY` — React devs reach for these by reflex; they do not exist in Gridland's event.
- `propagationStopped` / `defaultPrevented` are **getters**; the MDX must not imply you can assign them directly.
- There are **11** handlers on the base renderable (not 6, not 10). The list at `Renderable.ts:113-123` as of the rule-file capture is: `onMouse`, `onMouseDown`, `onMouseUp`, `onMouseMove`, `onMouseDrag`, `onMouseDragEnd`, `onMouseDrop`, `onMouseOver`, `onMouseOut`, `onMouseScroll`, `onClick`. Re-read before publishing — the list may have drifted.

### Hit-testing / propagation — verify before documenting

The archived bundle's draft included a "Hit Testing" section that said "the element with the higher `zIndex` receives the event" and a `stopPropagation` note. **Before publishing either claim**, verify against `Renderable.processMouseEvent` at `packages/core/src/Renderable.ts:1468-1536` whether:
- Hit testing uses `zIndex` or draw order or something else.
- `stopPropagation()` actually halts ancestor dispatch, or only sets a flag.

If either is uncertain, rewrite the section to describe the verified behavior. **No `TODO` strings or hedged language ("it probably works like…") may land in the published MDX** — Success Criterion 7 enforces this.

## Steps

1. **Read the runtime sources listed in Architecture Context.** Confirm the 11-handler list, the `MouseEvent` shape at `packages/core/src/renderer.ts:202-246`, and the scroll payload construction at `browser-renderer.ts:355-363`. Re-read `.claude/rules/opentui-event-dispatch.md` for the full verified shape. Everything in the MDX must cite this research.

2. **Create `packages/docs/content/docs/guides/pointer-events.mdx`** with the structure below. Verify each claim against step 1's research before committing.

   ~~~mdx
   ---
   title: Pointer Events
   description: Mouse and click handling on Gridland intrinsic elements.
   ---

   All intrinsic elements (`<box>`, `<text>`, `<input>`, etc.) support pointer event handlers. Handlers receive a single event object with cell coordinates and button info.

   ## Supported Events

   The 11 handlers below all receive the same event shape. The `type` field discriminates.

   | Event | Fires when |
   |---|---|
   | `onMouseDown` | Button pressed over the element |
   | `onMouseUp` | Button released over the element |
   | `onClick` | Press + release on the same element |
   | `onMouseOver` | Pointer enters the element |
   | `onMouseOut` | Pointer leaves the element |
   | `onMouseMove` | Pointer moves while over the element |
   | `onMouseDrag` | Drag gesture in progress over the element |
   | `onMouseDragEnd` | Drag gesture released |
   | `onMouseDrop` | Dragged item dropped onto the element |
   | `onMouseScroll` | Mouse wheel scrolled over the element |
   | `onMouse` | Catch-all: fires for every mouse event type |

   ## Event Payload

   ```ts
   interface PointerEvent {
     type: "down" | "up" | "over" | "out" | "move" | "drag" | "drag-end" | "drop" | "scroll"
     button: number                // 0 = left, 1 = middle, 2 = right
     x: number                     // cell column (NOT pixels)
     y: number                     // cell row
     target: Renderable | null
     modifiers: { shift: boolean; alt: boolean; ctrl: boolean }
     scroll?: { direction: "up" | "down" | "left" | "right"; delta: number }
     readonly defaultPrevented: boolean
     readonly propagationStopped: boolean
     preventDefault(): void
     stopPropagation(): void
   }
   ```

   > **Note:** `x` and `y` are cell coordinates, not pixels. Scroll events expose `scroll.direction` + `scroll.delta`, **not** DOM-style `deltaX` / `deltaY`. There is no `timestamp`, `nativeEvent`, `clientX`, or `clientY`. A named exported type for this shape is planned in a future release — for now, the handler parameter is inferred from the prop type.

   ## Hover-Steals-Focus Pattern

   Combine `onMouseOver` with `useFocus().focus()` to make hovering an element grab keyboard focus — a common multi-modal UI pattern.

   ```tsx
   const { focus } = useFocus({ id: "item-1" })
   return <box onMouseOver={() => focus()}>…</box>
   ```

   ## Scroll Events

   `onMouseScroll` fires when the mouse wheel is scrolled over the element. The `scroll` field is populated only for `type === "scroll"` events; read `event.scroll?.direction` (`"up" | "down" | "left" | "right"`) and `event.scroll?.delta` (a positive step count — Gridland reduces raw `WheelEvent.deltaX/deltaY` to a direction + magnitude).

   ## Hit Testing

   <!-- VERIFIED AGAINST Renderable.processMouseEvent BEFORE PUBLISH. Replace this comment with the actual behavior. -->
   ~~~

3. **Verify the Hit Testing section** against `packages/core/src/Renderable.ts:1468-1536`. Write the actual behavior — do not leave the HTML comment in the published file. If `stopPropagation()` is honored, show a code example. If it is a flag without a reader (see `tasks/006-keyevent-jsdoc.md` Open Question 1 for the parallel investigation on `KeyEvent`), document that honestly.

4. **Update `packages/docs/content/docs/guides/meta.json`** (or whatever fumadocs convention is in use — check adjacent files) to include `"pointer-events"` in the pages array near `"focus-and-navigation"`.

5. **Thin the duplicate section in `focus-and-navigation.mdx`.** Lines ~290-303 currently contain the full pointer events reference. Replace with:

   ```mdx
   ## Pointer Events

   Gridland intrinsic elements accept standard mouse event props (`onClick`, `onMouseOver`, `onMouseScroll`, and eight others). See the [Pointer Events guide](/docs/guides/pointer-events) for the full reference.
   ```

6. **Add a cross-link to `packages/docs/content/docs/components/primitives.mdx`.** Insert near the top of the file (after the intro paragraph, before the first element table):

   ```mdx
   > All primitives accept pointer event handlers. See [Pointer Events](/docs/guides/pointer-events).
   ```

## Verification

```bash
# Build — catches broken links and MDX errors
bun run --cwd packages/docs build

# Negative: no TODO / hedging strings shipped
rg "TODO" packages/docs/content/docs/guides/pointer-events.mdx && echo "FAIL" || echo "OK"
rg "probably|might|TBD" packages/docs/content/docs/guides/pointer-events.mdx

# Manual (dev server)
bun run --cwd packages/docs dev
# 1. Sidebar shows "Pointer Events" under Guides.
# 2. Docs-site search for "click", "mouse", "pointer" surfaces the new page.
# 3. /docs/components/primitives shows the cross-link callout near the top.
# 4. /docs/guides/focus-and-navigation no longer duplicates the full reference table — shows a one-paragraph summary + link.
# 5. The new page renders without MDX errors; the hit-testing section reflects actual Renderable.processMouseEvent behavior, not a TODO.
```

## Done when

- `pointer-events.mdx` exists, renders, and is in the sidebar.
- Docs-site search matches "click" / "mouse" / "pointer".
- `primitives.mdx` cross-links to it.
- `focus-and-navigation.mdx` no longer duplicates the full reference.
- Hit-testing section reflects verified runtime behavior with no `TODO` strings or hedging.
- `bun run --cwd packages/docs build` passes with no broken-link warnings.

## References

- Original bundle (archived): `tasks/004-types-and-docs-gap.md` §Ticket 4.
- Mouse-event dispatch rule: `.claude/rules/opentui-event-dispatch.md` — **required reading** before writing event-shape documentation. Auto-loads when you touch `packages/web/src/browser-renderer.ts`.
- Companion: `tasks/006-keyevent-jsdoc.md` (keyboard equivalent of this docs effort).
- Dependency: `tasks/backlog/pointer-event-types.md` — when that ships, update this MDX to `import type { GridlandPointerEvent } from "@gridland/web"` instead of inlining the interface.
