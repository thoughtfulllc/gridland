// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { CursorHighlightApp } from "../../../../demos/cursor-highlight"

export default function CursorHighlightDemo() {
  return (
    <DemoWindow title="Cursor Highlight" tuiStyle={{ width: "100%", height: 260 }} cursorHighlight>
      <CursorHighlightApp />
    </DemoWindow>
  )
}
