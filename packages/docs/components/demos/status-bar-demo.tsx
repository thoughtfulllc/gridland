// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { StatusBar, textStyle, useTheme } from "@gridland/ui"
import { useKeyboard } from "@gridland/utils"

const shortcuts = [
  { key: "Tab", label: "switch focus" },
  { key: "←→", label: "cycle" },
  { key: "b", label: "back" },
  { key: "z", label: "reset" },
]

function StatusBarApp() {
  const theme = useTheme()
  const [lastKey, setLastKey] = useState<string | null>(null)

  useKeyboard((event) => {
    if (event.name === "tab") {
      setLastKey("switch focus (Tab)")
    } else if (event.name === "left") {
      setLastKey("cycle (←)")
    } else if (event.name === "right") {
      setLastKey("cycle (→)")
    } else if (event.name === "b") {
      setLastKey("back (b)")
    } else if (event.name === "z") {
      setLastKey("reset (z)")
    }
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

export default function StatusBarDemo() {
  return (
    <DemoWindow title="StatusBar" tuiStyle={{ width: "100%", height: 80 }}>
      <StatusBarApp />
    </DemoWindow>
  )
}
