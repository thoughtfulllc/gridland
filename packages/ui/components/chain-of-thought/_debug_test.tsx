// @ts-nocheck
import { renderTui, cleanup } from "../../../testing/src/index"

// Test: Direct comparison with and without pipe char
// All using box width=20, border, marginLeft=1
// Expected text width: 20 - 2(border) - 1(margin) = 17

console.log("Expected text width per line: 17 chars\n")

// A: chars only (no pipe)
const { screen: sA } = renderTui(
  <box border width={20} height={5}>
    <box flexDirection="column" marginLeft={1}>
      <text>abcdefghijklmnopqrstuvwxyz</text>
    </box>
  </box>,
  { cols: 25, rows: 8 },
)
console.log("A: plain text")
sA.text().split("\n").forEach(l => { if (l.trim()) console.log(`|${l}|`) })
cleanup()

// B: starts with pipe char │
const { screen: sB } = renderTui(
  <box border width={20} height={5}>
    <box flexDirection="column" marginLeft={1}>
      <text>│abcdefghijklmnopqrstuvwxyz</text>
    </box>
  </box>,
  { cols: 25, rows: 8 },
)
console.log("\nB: starts with │ (U+2502)")
sB.text().split("\n").forEach(l => { if (l.trim()) console.log(`|${l}|`) })
cleanup()

// C: starts with regular pipe |
const { screen: sC } = renderTui(
  <box border width={20} height={5}>
    <box flexDirection="column" marginLeft={1}>
      <text>|abcdefghijklmnopqrstuvwxyz</text>
    </box>
  </box>,
  { cols: 25, rows: 8 },
)
console.log("\nC: starts with | (U+007C)")
sC.text().split("\n").forEach(l => { if (l.trim()) console.log(`|${l}|`) })
cleanup()

// D: starts with other box-drawing characters
const { screen: sD } = renderTui(
  <box border width={20} height={5}>
    <box flexDirection="column" marginLeft={1}>
      <text>┌abcdefghijklmnopqrstuvwxyz</text>
    </box>
  </box>,
  { cols: 25, rows: 8 },
)
console.log("\nD: starts with ┌ (U+250C)")
sD.text().split("\n").forEach(l => { if (l.trim()) console.log(`|${l}|`) })
cleanup()

// E: Xabcdef (normal char)
const { screen: sE } = renderTui(
  <box border width={20} height={5}>
    <box flexDirection="column" marginLeft={1}>
      <text>Xabcdefghijklmnopqrstuvwxyz</text>
    </box>
  </box>,
  { cols: 25, rows: 8 },
)
console.log("\nE: starts with X (normal)")
sE.text().split("\n").forEach(l => { if (l.trim()) console.log(`|${l}|`) })
cleanup()
