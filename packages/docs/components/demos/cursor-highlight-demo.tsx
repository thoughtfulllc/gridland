// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVX types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"

function CursorHighlightApp() {
  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <text style={{ bold: true, fg: "#fff" }}>Cursor Highlight</text>
      <text style={{ dim: true, fg: "#888" }}>Move your mouse over the grid below</text>
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
      <box height={1} />
      <text style={{ dim: true, fg: "#888" }}>
        The cell under your cursor is highlighted
      </text>
    </box>
  )
}

export default function CursorHighlightDemo() {
  return (
    <DemoWindow title="Cursor Highlight" tuiStyle={{ width: "100%", height: 240 }} cursorHighlight>
      <CursorHighlightApp />
    </DemoWindow>
  )
}
