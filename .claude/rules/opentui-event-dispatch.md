# OpenTUI Mouse Event Dispatch — Source of Truth

**When this loads:** You are touching `packages/core/src/react/utils/index.ts`, `packages/web/src/browser-renderer.ts`, `packages/web/src/gridland-jsx.d.ts`, `packages/web/src/gridland-events.ts`, or `tasks/004-types-and-docs-gap.md`.

## The Invariant

For every mouse event prop **other than `onClick`**, the source of truth for handler wiring is **OpenTUI's `Renderable.processMouseEvent`**, not a grep of the Gridland reconciler.

The Gridland reconciler at `packages/core/src/react/utils/index.ts` only special-cases `onClick` (lines 76-80). Every other mouse prop — `onMouseDown`, `onMouseUp`, `onMouseOver`, `onMouseOut`, `onMouseScroll` — falls into the default branch at lines 97-98, which does nothing but `instance[propKey] = propValue`. The reconciler never dispatches those handlers and never touches their payload shape. Dispatch happens inside OpenTUI, one layer down.

**If you grep `packages/core/src/react/` looking for a non-click mouse handler and find nothing, that is not evidence that no handler fires. It is evidence that the reconciler is not the place to look.**

## The `onClick` Exception

`onClick` is the one prop where grepping Gridland code is authoritative:

- Reconciler: `packages/core/src/react/utils/index.ts:76-80` — stores the handler as `instance.onClick`.
- Dispatch: `packages/web/src/browser-renderer.ts:249` — on `mouseup`, if the hit renderable is the same as the one hit on `mousedown`, calls `renderable._clickHandler(this.createTuiMouseEvent(renderable, "down", col, row, e))` directly.

One quirk worth knowing: the click synthesizer passes `type: "down"` (not `"click"`) on line 249, because it reuses the same `createTuiMouseEvent` helper without a dedicated click type. Type-narrowing on `event.type === "click"` inside an `onClick` handler will never match.

## What Gridland Constructs vs. What OpenTUI Dispatches

The event **object** is always built by `createTuiMouseEvent` at `packages/web/src/browser-renderer.ts:335-366`. Shape (verified 2026-04-15):

```ts
{
  type: "down" | "up" | "over" | "out" | "move" | "scroll",
  button: number,                // 0 = left, 1 = middle, 2 = right
  x: number,                     // cell column — NOT pixels (pixelToCell translates)
  y: number,                     // cell row
  target: Renderable,
  modifiers: { shift: boolean; alt: boolean; ctrl: boolean },
  propagationStopped: boolean,   // getter; mutate via stopPropagation()
  defaultPrevented: boolean,     // getter; mutate via preventDefault()
  stopPropagation(): void,
  preventDefault(): void,
  // Only present when type === "scroll":
  scroll?: { direction: "up" | "down" | "left" | "right"; delta: number },
}
```

Gridland then calls `target.processMouseEvent(event)` at browser-renderer.ts lines 144, 202, 209, 219, 244, and 294. `processMouseEvent` is an OpenTUI `Renderable` base-class method — **it** decides which prop-named property on the renderable to invoke for each `type` value, and whether to pass the event through untouched or narrow/rewrite it first. You cannot know that from Gridland's code alone.

## How to Verify Before Typing `onMouse*` Event Props

1. Read `packages/web/src/browser-renderer.ts:335-366` to confirm the constructed shape hasn't drifted from what this file documents.
2. Find OpenTUI's `Renderable` class (grep `class Renderable` under `node_modules/@opentui/core` or wherever OpenTUI is resolved at the time you read this). Read its `processMouseEvent` method.
3. Identify which property name — `onMouseOver`, `onMouseDown`, etc. — OpenTUI looks up for each event `type` value, and whether it invokes the property with the full event object or a narrowed one.
4. Only then write the `.d.ts` types. If OpenTUI passes the object through untouched, the shape above is correct. If OpenTUI narrows (e.g. strips `target`, renames fields per event type, or adds fields the reconciler didn't set), the types must reflect the narrowed shape.

## Surprises for Type Authors

- **`x` and `y` are cell coordinates, not pixels.** `pixelToCell` (browser-renderer.ts:135) translates before the event is constructed.
- **Scroll payload is `{ direction, delta }`, NOT `{ deltaX, deltaY }`.** See `createTuiMouseEvent` at browser-renderer.ts:355-363 — raw `WheelEvent.deltaX/deltaY` are reduced to a single direction + a positive `delta` count (`Math.max(1, Math.abs(Math.round(d / 40)))`). The DOM-style `deltaX/deltaY` fields never make it into the Gridland event.
- **No `timestamp`, `nativeEvent`, `clientX`, or `clientY`.** React devs reach for these by reflex; they do not exist.
- **`propagationStopped` and `defaultPrevented` are getters.** Mutate them only via `stopPropagation()` and `preventDefault()`; assigning directly will throw in strict mode and silently fail otherwise.

## Anti-Patterns

- **"I grepped `packages/core/src/react/` for `onMouseOver` and found nothing, so there's no payload to type."** The reconciler does not dispatch non-click mouse events. Absence of grep hits there is not absence of dispatch — the dispatch is in OpenTUI's `Renderable.processMouseEvent`.
- **Typing a scroll event as `{ deltaX: number; deltaY: number }`** because that is what DOM `WheelEvent` looks like. Gridland exposes `scroll: { direction, delta }` and drops the raw deltas; the DOM shape is thrown away at line 356.
- **Typing `x`/`y` as pixel coordinates.** They are cell coordinates (grid columns and rows).
- **Removing `propagationStopped` / `defaultPrevented` / `stopPropagation` / `preventDefault`** from the event type. Users call these; the type must expose them.
- **Trusting `tasks/004-types-and-docs-gap.md:60-66`'s grep instruction alone.** That grep is authoritative for `onClick` only. For the other five mouse props, it returns nothing useful because the reconciler doesn't handle them. See this rule's "How to Verify" section instead.

## Background

This rule exists because `tasks/004-types-and-docs-gap.md:60-66` instructs a grep — `rg -n "onClick|onMouseOver|onMouseOut|onMouseScroll|onMouseDown|onMouseUp" packages/core/src/react/ packages/web/src/` — which is authoritative for `onClick` but silently unhelpful for the other five mouse props. A junior engineer following the task verbatim will see no matches for `onMouseOver` in the reconciler, conclude the payload is unknown, and either guess or give up. The real lookup path is: Gridland builds the event object in `browser-renderer.ts:335`, then hands it to OpenTUI's `Renderable.processMouseEvent`, which owns prop-name routing for everything except `onClick`. Type authors must read OpenTUI's `Renderable` source, not Gridland's reconciler, before writing the non-click event types.
