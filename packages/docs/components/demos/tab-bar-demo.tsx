// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { TabBar, StatusBar } from "@gridland/ui"
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
    <box flexDirection="column" flexGrow={1}>
      <box padding={1}>
        <TabBar label="View" options={tabs} selectedIndex={selectedIndex} />
      </box>
      <box flexGrow={1} />
      <StatusBar items={[{ key: "←→", label: "switch tab" }]} />
    </box>
  )
}

export default function TabBarDemo() {
  return (
    <DemoWindow title="TabBar" tuiStyle={{ width: "100%", height: 120 }}>
      <TabBarApp />
    </DemoWindow>
  )
}
