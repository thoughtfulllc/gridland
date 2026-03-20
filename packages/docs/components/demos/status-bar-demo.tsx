// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { StatusBarApp } from "../../../../demos/status-bar"

export default function StatusBarDemo() {
  return (
    <DemoWindow title="StatusBar" tuiStyle={{ width: "100%", height: 80 }}>
      <StatusBarApp />
    </DemoWindow>
  )
}
