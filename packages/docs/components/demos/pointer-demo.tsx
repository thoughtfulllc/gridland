// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVX types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { PointerApp } from "../../../ui/scripts/demo-apps"

export default function PointerDemo() {
  return (
    <DemoWindow title="Pointer Events" tuiStyle={{ width: "100%", height: 280 }}>
      <PointerApp />
    </DemoWindow>
  )
}
