// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { FocusApp } from "../../../../demos/focus"

export default function FocusDemo() {
  return (
    <DemoWindow title="Focus & Navigation" tuiStyle={{ width: "100%", height: 340 }}>
      <FocusApp />
    </DemoWindow>
  )
}
