// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { ChatApp } from "../../../../demos/chat"

export default function ChatDemo() {
  return (
    <DemoWindow title="Chat" tuiStyle={{ width: "100%", height: 280 }}>
      <ChatApp />
    </DemoWindow>
  )
}
