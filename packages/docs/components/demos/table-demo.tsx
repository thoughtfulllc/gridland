// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { TUI } from "@polyterm.io/web"
import { MacWindow } from "@/components/ui/mac-window"
import { Table } from "@polyterm.io/ui"

const data = [
  { name: "Alice", role: "Engineer", status: "Active" },
  { name: "Bob", role: "Designer", status: "Active" },
  { name: "Charlie", role: "PM", status: "Away" },
]

export default function TableDemo() {
  return (
    <MacWindow title="Table">
      <TUI style={{ width: "100%", height: 240 }}>
        <box padding={1}>
          <Table data={data} headerColor="cyan" borderColor="#5e81ac" />
        </box>
      </TUI>
    </MacWindow>
  )
}
