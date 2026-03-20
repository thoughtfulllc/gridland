// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { PrimitivesApp } from "../../../../demos/primitives"

export default function PrimitivesDemo() {
  return (
    <DemoWindow title="Primitives" tuiStyle={{ width: "100%", height: 200 }}>
      <PrimitivesApp />
    </DemoWindow>
  )
}
