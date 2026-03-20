// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { ModalApp } from "../../../../demos/modal"

export default function ModalDemo() {
  return (
    <DemoWindow title="Modal" tuiStyle={{ width: "100%", height: 200 }}>
      <ModalApp />
    </DemoWindow>
  )
}
