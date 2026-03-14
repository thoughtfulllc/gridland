// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { Spinner, Table, MultiSelect } from "@gridland/ui"
import { useKeyboard } from "@gridland/core"

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
  return (
    <box flexDirection="column" padding={1} gap={1} flexGrow={1}>
      <Spinner text="Loading data..." />
      <Table data={tableData} />
      <MultiSelect items={selectItems} useKeyboard={useKeyboard} />
    </box>
  )
}

export default function ThemingDemo() {
  return (
    <DemoWindow title="Theming" tuiStyle={{ width: "100%", height: 380 }}>
      <ThemingApp />
    </DemoWindow>
  )
}
