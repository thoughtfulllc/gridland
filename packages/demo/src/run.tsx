// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { type ReactNode } from "react"
import { createCliRenderer, type CliRenderer, createRoot, useKeyboard } from "@gridland/bun"
import { demos } from "../../ui/scripts/demo-apps"

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

export async function runDemo(name: string) {
  const demo = demos.find((d) => d.name === name)
  if (!demo) {
    console.error(`Unknown demo: "${name}"`)
    console.error(`Available: ${demos.map((d) => d.name).join(", ")}`)
    process.exit(1)
  }

  _renderer = await createCliRenderer({ exitOnCtrlC: true })
  createRoot(_renderer).render(<DemoShell>{demo.app()}</DemoShell>)
}

export { demos }

// CLI entry point
const name = process.argv[2]
if (name) {
  runDemo(name)
}
