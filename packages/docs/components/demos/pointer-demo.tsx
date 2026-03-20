// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { PointerApp } from "../../../../demos/pointer"

export default function PointerDemo() {
  return (
    <DemoWindow title="Pointer Events" tuiStyle={{ width: "100%", height: 280 }}>
      <PointerApp />
    </DemoWindow>
  )
}
