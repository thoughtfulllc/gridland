// @ts-nocheck
import { useState } from "react"
import { FocusProvider, useFocusedShortcuts } from "@gridland/utils"
import { TabBar, StatusBar } from "@gridland/ui"

const tabs = ["Files", "Search", "Git", "Debug"]

function TabBarDemo() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const shortcuts = useFocusedShortcuts()

  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1}>
        <TabBar
          focusId="tabs"
          autoFocus
          options={tabs}
          selectedIndex={selectedIndex}
          onValueChange={setSelectedIndex}
        />
      </box>
      <box flexGrow={1} />
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={shortcuts} />
      </box>
    </box>
  )
}

export function TabBarApp() {
  return (
    <FocusProvider>
      <TabBarDemo />
    </FocusProvider>
  )
}
