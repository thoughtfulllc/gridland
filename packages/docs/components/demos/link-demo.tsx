// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { useKeyboard } from "@opentui/react"
import { DemoWindow } from "@/components/ui/demo-window"
import { Link, StatusBar, textStyle, useTheme, type UnderlineStyle } from "@gridland/ui"

const MODES: UnderlineStyle[] = ["solid", "dashed", "dotted", "none"]

function LinkApp() {
  const theme = useTheme()
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
        <text style={textStyle({ fg: theme.foreground })}>Made by <a href="https://cjroth.com" style={{ attributes: mode === "solid" ? 8 : mode === "dashed" ? 24 : mode === "dotted" ? 72 : 0, fg: theme.accent }}>Chris Roth</a>.</text>
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar
          extra={<span style={textStyle({ bold: true, fg: theme.foreground })}>{mode.padEnd(6)}</span>}
          items={[{ key: "←→", label: "underline style" }]}
        />
      </box>
    </box>
  )
}

export default function LinkDemo() {
  return (
    <DemoWindow title="Link" tuiStyle={{ width: "100%", height: 120 }}>
      <LinkApp />
    </DemoWindow>
  )
}
