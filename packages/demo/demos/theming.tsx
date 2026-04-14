// @ts-nocheck
"use client"
import { FocusProvider } from "@gridland/utils"
import { Spinner, Table, MultiSelect } from "@gridland/ui"

const tableData = [
  { name: "Alice", role: "Engineer", status: "Active" },
  { name: "Bob", role: "Designer", status: "Away" },
]

const selectItems = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
]

export function ThemingApp() {
  return (
    <FocusProvider selectable>
      <box flexDirection="column" padding={1} gap={1} flexGrow={1}>
        <Spinner text="Loading data..." />
        <Table data={tableData} />
        <MultiSelect focusId="langs" autoFocus items={selectItems} />
      </box>
    </FocusProvider>
  )
}
