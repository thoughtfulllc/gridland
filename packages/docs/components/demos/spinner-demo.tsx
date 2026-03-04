// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { OpenTuiCanvas } from "opentui-web"
import { MacWindow } from "@/components/ui/mac-window"
import { Spinner } from "opentui-ui"

export default function SpinnerDemo() {
  return (
    <MacWindow title="Spinner">
      <OpenTuiCanvas style={{ width: "100%", height: 80 }}>
        <box padding={1} flexDirection="column" gap={1}>
          <Spinner text="Loading..." color="cyan" />
          <Spinner text="Processing" color="#a3be8c" />
        </box>
      </OpenTuiCanvas>
    </MacWindow>
  )
}
