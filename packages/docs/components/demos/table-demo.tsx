// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { TableApp } from "@demos/table"

export default function TableDemo() {
  return (
    <DemoWindow title="Table" tuiStyle={{ width: "100%", height: 240 }}>
      <TableApp />
    </DemoWindow>
  )
}
