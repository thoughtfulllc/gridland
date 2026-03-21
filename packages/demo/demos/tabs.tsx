// @ts-nocheck
import { useState } from "react"
import { useKeyboard } from "@gridland/utils"
import { TabBar, StatusBar } from "@gridland/ui"

const tabs = ["Files", "Search", "Git", "Debug"]

export function TabBarApp() {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useKeyboard((event) => {
    if (event.name === "left") setSelectedIndex((i) => (i > 0 ? i - 1 : tabs.length - 1))
    if (event.name === "right") setSelectedIndex((i) => (i < tabs.length - 1 ? i + 1 : 0))
  })

  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1}>
        <TabBar options={tabs} selectedIndex={selectedIndex} />
      </box>
      <box flexGrow={1} />
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "←→", label: "switch tab" }]} />
      </box>
    </box>
  )
}
