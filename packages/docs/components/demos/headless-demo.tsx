// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { SimpleTable } from "@gridland/ui"

const data = [
  { name: "Alice", role: "Engineer", status: "Active" },
  { name: "Bob", role: "Designer", status: "Active" },
  { name: "Charlie", role: "PM", status: "Away" },
]

export default function HeadlessDemo() {
  return (
    <DemoWindow title="Headless" tuiStyle={{ width: "100%", height: 240, borderRadius: 8 }}>
      <box padding={1}>
        <SimpleTable data={data} />
      </box>
    </DemoWindow>
  )
}
