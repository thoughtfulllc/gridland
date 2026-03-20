// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { PromptInputApp } from "../../../../demos/prompt-input"

export default function PromptInputDemo() {
  return (
    <DemoWindow title="PromptInput" tuiStyle={{ width: "100%", height: 300 }}>
      <PromptInputApp />
    </DemoWindow>
  )
}
