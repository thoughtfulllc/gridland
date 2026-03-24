// @ts-nocheck
import { Table } from "@gridland/ui"

export function TableApp() {
  const data = [
    { name: "Alice", role: "Engineer", status: "Active" },
    { name: "Bob", role: "Designer", status: "Active" },
    { name: "Charlie", role: "PM", status: "Away" },
  ]
  return (
    <box padding={1} flexGrow={1}>
      <Table data={data} headerColor="cyan" borderColor="#5e81ac" />
    </box>
  )
}
