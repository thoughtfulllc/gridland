"use client"
import { MacWindow } from "@polyterm.io/ui"

export default function MacWindowDemo() {
  return (
    <MacWindow title="my-terminal" minWidth={400}>
      <div style={{ padding: 16, background: "#1e1e2e", color: "#cdd6f4", fontFamily: "monospace" }}>
        <p>$ echo &quot;Hello from MacWindow&quot;</p>
        <p>Hello from MacWindow</p>
      </div>
    </MacWindow>
  )
}
