// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { TUI } from "@polyterm.io/web"
import { MacWindow } from "@/components/ui/mac-window"
import { Gradient } from "@polyterm.io/ui"

export default function GradientDemo() {
  return (
    <MacWindow title="Gradient">
      <TUI style={{ width: "100%", height: 120 }}>
        <box padding={1} flexDirection="column" gap={1}>
          <Gradient name="rainbow">
            {"Hello, Gradient!"}
          </Gradient>
          <Gradient name="passion">
            {"Passion gradient text"}
          </Gradient>
          <Gradient name="vice">
            {"Vice gradient text"}
          </Gradient>
        </box>
      </TUI>
    </MacWindow>
  )
}
