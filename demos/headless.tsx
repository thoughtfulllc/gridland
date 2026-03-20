// @ts-nocheck
import { Table } from "@gridland/ui"

const data = [
  { name: "Alice", role: "Engineer", status: "Active" },
  { name: "Bob", role: "Designer", status: "Active" },
  { name: "Charlie", role: "PM", status: "Away" },
]

export function HeadlessApp() {
  return (
    <box padding={1}>
      <Table data={data} />
    </box>
  )
}
