// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { TUI } from "@polyterm.io/web"
import { MacWindow } from "@/components/ui/mac-window"
import { Link } from "@polyterm.io/ui"

export default function LinkDemo() {
  return (
    <MacWindow title="Link">
      <TUI style={{ width: "100%", height: 80 }}>
        <box padding={1} flexDirection="column" gap={1}>
          <text fg="#d8dee9">Click the link below:</text>
          <Link url="https://opentui.dev">Visit opentui.dev</Link>
        </box>
      </TUI>
    </MacWindow>
  )
}
