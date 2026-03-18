// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVX types
"use client"
import { useState, useRef } from "react"
import { DemoWindow } from "@/components/ui/demo-window"

function CursorHighlightApp() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const posRef = useRef<{ x: number; y: number } | null>(null)

  return (
    <box
      flexDirection="column"
      flexGrow={1}
      onMouseMove={(e: any) => {
        posRef.current = { x: e.x, y: e.y }
        setPos({ x: e.x, y: e.y })
      }}
    >
      <box flexDirection="column" flexGrow={1} padding={1}>
        <text style={{ bold: true, fg: "#fff" }}>Cursor Highlight</text>
        <text style={{ dim: true, fg: "#888" }}>Move your mouse over the grid</text>
        <box height={1} />
        <box flexDirection="column">
          {Array.from({ length: 6 }, (_, row) => (
            <text key={row}>
              {Array.from({ length: 40 }, (_, col) => {
                const isEven = (row + col) % 2 === 0
                return (
                  <span key={col} style={{
                    fg: isEven ? "#3b82f6" : "#8b5cf6",
                    dim: !isEven,
                  }}>
                    {isEven ? "░░" : "▓▓"}
                  </span>
                )
              })}
            </text>
          ))}
        </box>
      </box>
      <box paddingX={1} paddingBottom={1}>
        <text>
          <span style={{ bold: true, fg: "#1e1e2e", bg: "#888" }}>{" x "}</span>
          <span style={{ dim: true, fg: "#888" }}>{` ${pos ? String(pos.x).padStart(3) : "  -"} `}</span>
          <span style={{ bold: true, fg: "#1e1e2e", bg: "#888" }}>{" y "}</span>
          <span style={{ dim: true, fg: "#888" }}>{` ${pos ? String(pos.y).padStart(3) : "  -"} `}</span>
          <span style={{ dim: true, fg: "#555" }}>{" │ "}</span>
          <span style={{ dim: true, fg: "#888" }}>{"move mouse to track position"}</span>
        </text>
      </box>
    </box>
  )
}

export default function CursorHighlightDemo() {
  return (
    <DemoWindow title="Cursor Highlight" tuiStyle={{ width: "100%", height: 260 }} cursorHighlight>
      <CursorHighlightApp />
    </DemoWindow>
  )
}
