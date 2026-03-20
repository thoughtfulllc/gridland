// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { LinkApp } from "../../../../demos/link"

export default function LinkDemo() {
  return (
    <DemoWindow title="Link" tuiStyle={{ width: "100%", height: 120 }}>
      <LinkApp />
    </DemoWindow>
  )
}
