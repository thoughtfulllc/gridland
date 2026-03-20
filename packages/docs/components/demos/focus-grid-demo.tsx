// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVX types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { FocusGridApp } from "../../../ui/scripts/demo-apps"

export default function FocusGridDemo() {
  return (
    <DemoWindow title="Spatial Navigation" tuiStyle={{ width: "100%", height: 340 }}>
      <FocusGridApp />
    </DemoWindow>
  )
}
