// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { Spinner } from "@gridland/ui"

export default function SpinnerDemo() {
  return (
    <DemoWindow title="Spinner" tuiStyle={{ width: "100%", height: 80 }}>
      <box padding={1} flexDirection="column" gap={1}>
        <Spinner text="Loading..." />
        <Spinner text="Processing" color="green" />
      </box>
    </DemoWindow>
  )
}
