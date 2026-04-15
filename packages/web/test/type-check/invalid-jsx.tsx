// Negative type checks: every @ts-expect-error must match a real type error.
// If any directive becomes "unused", tsc exits non-zero — the test fails.
import React from "react"

// Nonexistent elements are rejected
// @ts-expect-error — "notarealelement" is not in JSX.IntrinsicElements
const bad1 = <notarealelement />

// @ts-expect-error — "fakebox" is not in JSX.IntrinsicElements
const bad2 = <fakebox flexDirection="row" />

// Invalid prop values on typed elements are rejected
// @ts-expect-error — "banana" is not a valid flexDirection
const bad3 = <box flexDirection="banana" />

// @ts-expect-error — "bold" is not a valid borderStyle
const bad4 = <box borderStyle="bold" />

// @ts-expect-error — "auto" is not a valid overflow value
const bad5 = <box overflow="auto" />

// @ts-expect-error — "left" is not a valid flexWrap
const bad6 = <box flexWrap="left" />

// INV-3 filter coverage (tasks/003 §4.4): Zig-FFI intrinsics tagged
// terminal-only in packages/core/src/react/types/runtime-capability.ts are
// omitted from the browser JSX augmentation in
// packages/web/src/gridland-jsx.d.ts and must not compile here.
//
// Known limitation: `<input>` and `<textarea>` collide with HTML element
// names that React already types. Removing them from Gridland's augmentation
// doesn't stop them from compiling — they fall through to React's built-in
// HTMLInputElement / HTMLTextAreaElement types. So the type-level filter
// is only enforceable for Gridland-unique intrinsic names. For `input` and
// `textarea`, the runtime unit tests in
// packages/core/src/react/types/__tests__/intrinsic-tags.test.ts verify the
// capability tag; runtime misuse is caught by the reconciler at mount time.
//
// Note: `<ascii-font>` was terminal-only after Phase 2 but flipped to
// dual-impl in Phase 3 (a BrowserAsciiFontRenderable now ships via
// packages/web/src/components/register.ts). It compiles again — valid-jsx.tsx
// covers that positive assertion.

// @ts-expect-error — "line-number" is terminal-only (Zig FFI FrameBuffer)
const terminal1 = <line-number />

