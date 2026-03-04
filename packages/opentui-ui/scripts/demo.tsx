// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { renderTui, cleanup } from "../../opentui-testing/src/index"
import { fixtures } from "./demo-fixtures"

const filter = process.argv[2]

const selected = filter
  ? fixtures.filter((f) => f.name === filter)
  : fixtures

if (filter && selected.length === 0) {
  console.error(`Unknown component: "${filter}"`)
  console.error(`Available: ${fixtures.map((f) => f.name).join(", ")}`)
  process.exit(1)
}

// Suppress known noise from the test environment:
// - React ErrorBoundary dumps for Zig-dependent components (TextInput)
// - "Invalid borderStyle" warnings from primitives demo
const origError = console.error
console.error = (...args: any[]) => {
  const msg = String(args[0])
  if (msg.includes("Zig render library") || msg.includes("react-stack-top-frame")) return
  origError(...args)
}
const origWarn = console.warn
console.warn = (...args: any[]) => {
  const msg = String(args[0])
  if (msg.includes("Invalid borderStyle")) return
  origWarn(...args)
}

for (const fixture of selected) {
  const { screen } = renderTui(fixture.jsx(), {
    cols: fixture.cols,
    rows: fixture.rows,
  })

  console.log(`\n${"=".repeat(fixture.cols)}`)
  console.log(`  ${fixture.name}`)
  console.log(`${"=".repeat(fixture.cols)}`)
  console.log(screen.text())

  cleanup()
}

process.exit(0)
