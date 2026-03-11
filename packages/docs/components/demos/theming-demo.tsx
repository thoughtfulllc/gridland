// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import {
  ThemeProvider,
  darkTheme,
  lightTheme,
  Spinner,
  Table,
  MultiSelect,
  StatusBar,
  textStyle,
} from "@gridland/ui"
import { useKeyboard } from "@opentui/react"

const themes = [
  { name: "Dark", theme: darkTheme },
  { name: "Light", theme: lightTheme },
] as const

const tableData = [
  { name: "Alice", role: "Engineer", status: "Active" },
  { name: "Bob", role: "Designer", status: "Away" },
]

const selectItems = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
]

function ThemingApp() {
  const [themeIndex, setThemeIndex] = useState(0)
  const currentTheme = themes[themeIndex]

  useKeyboard((event) => {
    if (event.name === "left") {
      setThemeIndex((i) => (i > 0 ? i - 1 : themes.length - 1))
    }
    if (event.name === "right") {
      setThemeIndex((i) => (i < themes.length - 1 ? i + 1 : 0))
    }
  })

  return (
    <ThemeProvider theme={currentTheme.theme}>
      <box flexDirection="column" flexGrow={1}>
        <box flexDirection="column" padding={1} gap={1} flexGrow={1}>
          <Spinner text="Loading data..." />
          <Table data={tableData} />
          <MultiSelect items={selectItems} useKeyboard={useKeyboard} />
        </box>
        <box paddingLeft={1} paddingBottom={1}>
          <StatusBar
            items={[{ key: "←→", label: "theme" }]}
            extra={<span style={textStyle({ bold: true })}>{currentTheme.name.padEnd(5)}</span>}
          />
        </box>
      </box>
    </ThemeProvider>
  )
}

export default function ThemingDemo() {
  return (
    <DemoWindow title="Theming" tuiStyle={{ width: "100%", height: 380 }}>
      <ThemingApp />
    </DemoWindow>
  )
}
