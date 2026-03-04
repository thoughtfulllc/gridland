// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { OpenTuiCanvas } from "opentui-web"
import { MacWindow } from "@/components/ui/mac-window"
import { Link } from "opentui-ui"

export default function LinkDemo() {
  return (
    <MacWindow title="Link">
      <OpenTuiCanvas style={{ width: "100%", height: 80 }}>
        <box padding={1} flexDirection="column" gap={1}>
          <text fg="#d8dee9">Click the link below:</text>
          <Link url="https://opentui.dev">Visit opentui.dev</Link>
        </box>
      </OpenTuiCanvas>
    </MacWindow>
  )
}
