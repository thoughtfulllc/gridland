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

// Input element with strong types
const input = <input value="hello" placeholder="type..." onInput={(v: string) => console.log(v)} />

// Other custom elements exist
const scrollbox = <scrollbox />
const code = <code />
const md = <markdown />
const diff = <diff />
const asciiFont = <ascii-font />
const tabSelect = <tab-select />
const lineNumber = <line-number />

// Standard HTML elements still work (widened by the augmentation)
const div = <div className="test" />
