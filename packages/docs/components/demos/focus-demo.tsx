// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVX types
"use client"
import { useState } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { useKeyboard } from "@gridland/utils"

const panels = [
  { id: "panel1", label: "Panel 1" },
  { id: "panel2", label: "Panel 2" },
  { id: "panel3", label: "Panel 3" },
]

function FocusDemoApp() {
  const [focusedIndex, setFocusedIndex] = useState(0)

  useKeyboard((event) => {
    if (event.name === "down" || event.name === "tab") {
      setFocusedIndex((i) => (i + 1) % panels.length)
      event.preventDefault()
    } else if (event.name === "up") {
      setFocusedIndex((i) => (i - 1 + panels.length) % panels.length)
      event.preventDefault()
    }
  })

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <text style={{ bold: true, fg: "#fff" }}>Focus Navigation Demo</text>
      <text style={{ dim: true, fg: "#888" }}>Press Tab or ↑↓ to navigate between panels</text>
      <box height={1} />
      <box flexDirection="row" gap={1} flexGrow={1}>
        {panels.map((panel, i) => {
          const focused = i === focusedIndex
          return (
            <box
              key={panel.id}
              border
              borderStyle="rounded"
              borderColor={focused ? "#22c55e" : "#555"}
              flexGrow={1}
              padding={1}
            >
              <text style={{ fg: focused ? "#22c55e" : "#888", bold: focused }}>
                {focused ? `▸ ${panel.label} (focused)` : `  ${panel.label}`}
              </text>
            </box>
          )
        })}
      </box>
      <box height={1} />
      <text style={{ dim: true, fg: "#888" }}>Tab next  ↑↓ navigate</text>
    </box>
  )
}

export default function FocusDemo() {
  return (
    <DemoWindow title="Focus & Navigation" tuiStyle={{ width: "100%", height: 300 }}>
      <FocusDemoApp />
    </DemoWindow>
  )
}
