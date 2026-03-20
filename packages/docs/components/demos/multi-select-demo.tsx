// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { MultiSelectApp } from "../../../../demos/multi-select"

export default function MultiSelectDemo() {
  return (
    <DemoWindow title="MultiSelect" tuiStyle={{ width: "100%", height: 240 }}>
      <MultiSelectApp />
    </DemoWindow>
  )
}
