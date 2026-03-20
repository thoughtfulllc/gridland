// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVX types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { FocusApp } from "../../../ui/scripts/demo-apps"

export default function FocusDemo() {
  return (
    <DemoWindow title="Focus & Navigation" tuiStyle={{ width: "100%", height: 380 }}>
      <FocusApp />
    </DemoWindow>
  )
}
