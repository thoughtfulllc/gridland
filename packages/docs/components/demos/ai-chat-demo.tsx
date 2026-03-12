// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { AIChat } from "@gridland/ui"
import { useKeyboard } from "@opentui/react"

export default function AIChatDemo() {
  return (
    <DemoWindow title="AI Chat" tuiStyle={{ width: "100%", height: 560 }}>
      <AIChat useKeyboard={useKeyboard} />
    </DemoWindow>
  )
}
