// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { AIChatInterfaceApp } from "@demos/ai-chat-interface"
import { chatTransport } from "@/lib/chat"

export default function AIChatInterfaceDemo() {
  return (
    <DemoWindow title="AI Chat Interface" tuiStyle={{ width: "100%", height: 480 }} autoFocus>
      <AIChatInterfaceApp transport={chatTransport} />
    </DemoWindow>
  )
}
