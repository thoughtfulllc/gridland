// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { HeadlessApp } from "../../../../demos/headless"

export default function HeadlessDemo() {
  return (
    <DemoWindow title="Headless" tuiStyle={{ width: "100%", height: 240, borderRadius: 8 }}>
      <HeadlessApp />
    </DemoWindow>
  )
}
