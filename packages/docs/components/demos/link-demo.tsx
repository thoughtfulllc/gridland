// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { TUI } from "@polyterm.io/web"
import { useKeyboard } from "@opentui/react"
import { TerminalWindow } from "@/components/ui/mac-window"
import { Link, StatusBar, textStyle, type UnderlineStyle } from "@polyterm.io/ui"

const MODES: UnderlineStyle[] = ["solid", "dashed", "dotted", "none"]

function LinkApp() {
  const [modeIndex, setModeIndex] = useState(0)
  const mode = MODES[modeIndex]

  useKeyboard((event) => {
    if (event.name === "right") {
      setModeIndex((i) => (i + 1) % MODES.length)
    } else if (event.name === "left") {
      setModeIndex((i) => (i - 1 + MODES.length) % MODES.length)
    }
  })

  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1} flexGrow={1}>
        <text>Made by <a href="https://cjroth.com" style={{ attributes: mode === "solid" ? 8 : mode === "dashed" ? 24 : mode === "dotted" ? 72 : 0 }}>Chris Roth</a>.</text>
      </box>
      <StatusBar
        extra={<span style={textStyle({ bold: true })}>{mode.padEnd(6)}</span>}
        items={[{ key: "←→", label: "underline style" }]}
      />
    </box>
  )
}

export default function LinkDemo() {
  return (
    <TerminalWindow title="Link">
      <TUI style={{ width: "100%", height: 120 }}>
        <LinkApp />
      </TUI>
    </TerminalWindow>
  )
}
