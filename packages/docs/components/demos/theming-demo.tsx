// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { ThemingApp } from "../../../../demos/theming"

export default function ThemingDemo() {
  return (
    <DemoWindow title="Theming" tuiStyle={{ width: "100%", height: 380 }}>
      <ThemingApp />
    </DemoWindow>
  )
}
