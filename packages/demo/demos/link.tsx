// @ts-nocheck
"use client"
import { useState } from "react"
import { useKeyboard } from "@gridland/utils"
import { Link, StatusBar, textStyle, useTheme } from "@gridland/ui"
import type { UnderlineStyle } from "@gridland/ui"

const MODES: UnderlineStyle[] = ["solid", "dashed", "dotted", "none"]

export function LinkApp() {
  const theme = useTheme()
  const [modeIndex, setModeIndex] = useState(0)
  const mode = MODES[modeIndex]

  useKeyboard((event) => {
    if (event.name === "right") setModeIndex((i) => (i + 1) % MODES.length)
    if (event.name === "left") setModeIndex((i) => (i - 1 + MODES.length) % MODES.length)
  })

  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1} flexGrow={1} gap={0}>
        <text style={textStyle({ fg: theme.foreground })}>Made by</text>
        <Link url="https://cjroth.com" underline={mode}>Chris Roth</Link>
        <text style={textStyle({ fg: theme.foreground })}>and</text>
        <Link url="https://jessicacheng.studio" underline={mode}>Jessica Cheng</Link>
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
