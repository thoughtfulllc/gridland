// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { SelectInputApp } from "../../../../demos/select-input"

export default function SelectInputDemo() {
  return (
    <DemoWindow title="SelectInput" tuiStyle={{ width: "100%", height: 240 }}>
      <SelectInputApp />
    </DemoWindow>
  )
}
