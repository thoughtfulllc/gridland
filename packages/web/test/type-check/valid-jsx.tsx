// Positive type checks: all lines must compile without errors.
import React from "react"

// Gridland-only elements exist and accept typed props
const box1 = <box flexDirection="row" width={100} height={50} />
const box2 = <box flexDirection="column" padding={2} gap={1} />

// All valid flexDirection values
const fd1 = <box flexDirection="row" />
const fd2 = <box flexDirection="column" />
const fd3 = <box flexDirection="row-reverse" />
const fd4 = <box flexDirection="column-reverse" />

// All valid borderStyle values
const bs1 = <box borderStyle="single" />
const bs2 = <box borderStyle="double" />
const bs3 = <box borderStyle="rounded" />
const bs4 = <box borderStyle="heavy" />

// All valid overflow values
const ov1 = <box overflow="visible" />
const ov2 = <box overflow="hidden" />
const ov3 = <box overflow="scroll" />

// Nested boxes
const nested = (
  <box flexDirection="column">
    <box flexDirection="row" />
  </box>
)

// Universal intrinsics (see tasks/003 §4.4)
const scrollbox = <scrollbox />
const code = <code />
const md = <markdown />
const diff = <diff />
const tabSelect = <tab-select />

// Dual-impl intrinsics — Phase 3 of tasks/003 added a browser implementation
// (packages/web/src/components/browser-ascii-font.ts) registered via
// register.ts, so ascii-font is back in the browser JSX namespace.
const asciiFont = <ascii-font text="hello" font="tiny" />

// Standard HTML elements still work (widened by the augmentation)
const div = <div className="test" />

// Note: <input>, <textarea>, and <line-number> remain terminal-only — see
// invalid-jsx.tsx for the coverage notes and the line-number @ts-expect-error.
