// @ts-nocheck — OpenTUI intrinsic elements (box, text) conflict with React's HTML/SVG types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"

export default function PrimitivesDemo() {
  return (
    <DemoWindow title="Primitives" tuiStyle={{ width: "100%", height: 200 }}>
      <box flexDirection="column" padding={1}>
        <box
          border
          borderStyle="rounded"
          borderColor="#75715e"
          title="Layout"
          titleAlignment="center"
          padding={1}
        >
          <box flexDirection="row" gap={2}>
            <box
              border
              borderStyle="single"
              borderColor="#a6e22e"
              padding={1}
              flexGrow={1}
            >
              <text fg="#a6e22e" bold>
                Box 1
              </text>
            </box>
            <box
              border
              borderStyle="single"
              borderColor="#f92672"
              padding={1}
              flexGrow={1}
            >
              <text fg="#f92672" bold>
                Box 2
              </text>
            </box>
            <box
              border
              borderStyle="single"
              borderColor="#66d9ef"
              padding={1}
              flexGrow={1}
            >
              <text fg="#66d9ef" bold>
                Box 3
              </text>
            </box>
          </box>
        </box>
        <text dim fg="#75715e">
          {"  Nested boxes with borders, colors & flexbox layout"}
        </text>
      </box>
    </DemoWindow>
  )
}
