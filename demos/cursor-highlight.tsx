// @ts-nocheck
import { useState } from "react"
import { StatusBar, textStyle } from "@gridland/ui"

export function CursorHighlightApp() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  return (
    <box
      flexDirection="column"
      flexGrow={1}
      onMouseMove={(e: any) => {
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
        <StatusBar
          items={[]}
          extra={
            <span>
              <span style={textStyle({ bold: true, fg: "#1e1e2e", bg: "#888" })}>{" x "}</span>
              <span style={textStyle({ dim: true, fg: "#888" })}>{` ${pos ? String(pos.x).padStart(3) : "  -"} `}</span>
              <span style={textStyle({ bold: true, fg: "#1e1e2e", bg: "#888" })}>{" y "}</span>
              <span style={textStyle({ dim: true, fg: "#888" })}>{` ${pos ? String(pos.y).padStart(3) : "  -"}`}</span>
            </span>
          }
        />
      </box>
    </box>
  )
}
