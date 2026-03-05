// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { createElement, type ReactNode } from "react"
import { createCliRenderer, type CliRenderer } from "@opentui/core"
import { createRoot, useKeyboard } from "@opentui/react"
import { demos } from "./demo-apps"

let _renderer: CliRenderer

function DemoShell({ children }: { children: ReactNode }) {
  useKeyboard((event) => {
    if (event.name === "q" || event.name === "escape") {
      _renderer.destroy()
    }
  })

  return (
    <box flexDirection="column" flexGrow={1}>
      {children}
    </box>
  )
}

const name = process.argv[2]

if (!name) {
  console.log("Available demos:")
  for (const d of demos) {
    console.log(`  ${d.name}`)
  }
  console.log(`\nUsage: bun run demo <name>`)
  process.exit(0)
}

const demo = demos.find((d) => d.name === name)
if (!demo) {
  console.error(`Unknown demo: "${name}"`)
  console.error(`Available: ${demos.map((d) => d.name).join(", ")}`)
  process.exit(1)
}

_renderer = await createCliRenderer({ exitOnCtrlC: true })
createRoot(_renderer).render(<DemoShell>{demo.app()}</DemoShell>)
