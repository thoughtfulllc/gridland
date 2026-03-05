// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { TUI } from "@polyterm.io/web"
import { MacWindow } from "@/components/ui/mac-window"
import { TabBar, textStyle } from "@polyterm.io/ui"
import { useKeyboard } from "@opentui/react"

const tabs = ["Files", "Search", "Git", "Debug"]

function TabBarApp() {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useKeyboard((event) => {
    if (event.name === "left") {
      setSelectedIndex((i) => (i > 0 ? i - 1 : tabs.length - 1))
    }
    if (event.name === "right") {
      setSelectedIndex((i) => (i < tabs.length - 1 ? i + 1 : 0))
    }
  })

  return (
    <box flexDirection="column" gap={1} padding={1}>
      <TabBar label="View" options={tabs} selectedIndex={selectedIndex} />
      <text style={textStyle({ dim: true })}>Use ←/→ arrow keys to switch tabs</text>
    </box>
  )
}

export default function TabBarDemo() {
  return (
    <MacWindow title="TabBar">
      <TUI style={{ width: "100%", height: 80 }}>
        <TabBarApp />
      </TUI>
    </MacWindow>
  )
}
