// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { OpenTuiCanvas } from "opentui-web"
import { MacWindow } from "@/components/ui/mac-window"
import { TextInput } from "opentui-ui"

export default function TextInputDemo() {
  return (
    <MacWindow title="TextInput">
      <OpenTuiCanvas style={{ width: "100%", height: 80 }}>
        <box padding={1} flexDirection="column" gap={1}>
          <text fg="#d8dee9" bold>Enter your name:</text>
          <TextInput placeholder="Type something..." prompt="> " />
        </box>
      </OpenTuiCanvas>
    </MacWindow>
  )
}
