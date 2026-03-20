// @ts-nocheck
import { useState } from "react"
import { useKeyboard } from "@gridland/utils"
import { StatusBar, textStyle, useTheme } from "@gridland/ui"

const shortcuts = [
  { key: "Tab", label: "switch focus" },
  { key: "←→", label: "cycle" },
  { key: "b", label: "back" },
  { key: "z", label: "reset" },
]

export function StatusBarApp() {
  const theme = useTheme()
  const [lastKey, setLastKey] = useState<string | null>(null)

  useKeyboard((event) => {
    if (event.name === "tab") setLastKey("switch focus (Tab)")
    else if (event.name === "left") setLastKey("cycle (←)")
    else if (event.name === "right") setLastKey("cycle (→)")
    else if (event.name === "b") setLastKey("back (b)")
    else if (event.name === "z") setLastKey("reset (z)")
  })

  return (
    <box flexDirection="column" gap={1} padding={1}>
      {lastKey ? (
        <text>
          <span>Pressed: </span>
          <span style={textStyle({ bold: true, fg: theme.accent })}>{lastKey}</span>
        </text>
      ) : (
        <text style={textStyle({ dim: true })}>Press a key to trigger an action</text>
      )}
      <StatusBar
        items={shortcuts}
        extra={<span style={textStyle({ fg: theme.success })}>● Ready</span>}
      />
    </box>
  )
}
