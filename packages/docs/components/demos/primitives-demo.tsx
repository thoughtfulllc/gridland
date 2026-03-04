// @ts-nocheck — OpenTUI intrinsic elements (box, text) conflict with React's HTML/SVG types
"use client"
import { OpenTuiCanvas } from "opentui-web"
import { MacWindow } from "@/components/ui/mac-window"

export default function PrimitivesDemo() {
  return (
    <MacWindow title="Primitives">
      <OpenTuiCanvas style={{ width: "100%", height: 200 }}>
        <box flexDirection="column" padding={1}>
          <box
            border
            borderStyle="rounded"
            borderColor="#5e81ac"
            title="Layout"
            titleAlignment="center"
            padding={1}
          >
            <box flexDirection="row" gap={2}>
              <box
                border
                borderStyle="single"
                borderColor="#a3be8c"
                padding={1}
                flexGrow={1}
              >
                <text fg="#a3be8c" bold>
                  Box 1
                </text>
              </box>
              <box
                border
                borderStyle="single"
                borderColor="#ebcb8b"
                padding={1}
                flexGrow={1}
              >
                <text fg="#ebcb8b" bold>
                  Box 2
                </text>
              </box>
              <box
                border
                borderStyle="single"
                borderColor="#b48ead"
                padding={1}
                flexGrow={1}
              >
                <text fg="#b48ead" bold>
                  Box 3
                </text>
              </box>
            </box>
          </box>
          <text fg="#d8dee9" dim>
            {"  Nested boxes with borders, colors & flexbox layout"}
          </text>
        </box>
      </OpenTuiCanvas>
    </MacWindow>
  )
}
