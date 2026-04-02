// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { FocusAIChatApp } from "@demos/focus-ai-chat"
import { chatTransport } from "@/lib/chat"

export default function FocusAIChatDemo() {
  return (
    <DemoWindow title="AI Chat with Focus & Navigation" tuiStyle={{ width: "100%", height: 480 }} autoFocus>
      <FocusAIChatApp transport={chatTransport} />
    </DemoWindow>
  )
}
