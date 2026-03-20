// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { TerminalWindowApp } from "../../../../demos/terminal-window"

export default function TerminalWindowDemo() {
  return (
    <DemoWindow title="Terminal" tuiStyle={{ width: "100%", height: 120 }}>
      <TerminalWindowApp />
    </DemoWindow>
  )
}
