// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { AsciiApp } from "../../../../demos/ascii"

export default function AsciiDemo() {
  return (
    <DemoWindow title="Ascii" tuiStyle={{ width: "100%", height: 280 }}>
      <AsciiApp />
    </DemoWindow>
  )
}
