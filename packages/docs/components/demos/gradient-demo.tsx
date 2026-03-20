// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { GradientApp } from "../../../../demos/gradient"

export default function GradientDemo() {
  return (
    <DemoWindow title="Gradient" tuiStyle={{ width: "100%", height: 280 }}>
      <GradientApp />
    </DemoWindow>
  )
}
