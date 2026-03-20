// @ts-nocheck
import { useState } from "react"
import { useKeyboard } from "@gridland/utils"
import { StatusBar, textStyle, useTheme } from "@gridland/ui"
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
      <box padding={1} flexGrow={1}>
        <text style={textStyle({ fg: theme.foreground })}>Made by <a href="https://cjroth.com" style={{ attributes: mode === "solid" ? 8 : mode === "dashed" ? 24 : mode === "dotted" ? 72 : 0, fg: theme.accent }}>Chris Roth</a> and <a href="https://jessicacheng.studio" style={{ attributes: mode === "solid" ? 8 : mode === "dashed" ? 24 : mode === "dotted" ? 72 : 0, fg: theme.accent }}>Jessica Cheng</a>.</text>
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
