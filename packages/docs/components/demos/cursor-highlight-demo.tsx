// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVX types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { CursorHighlightApp } from "../../../ui/scripts/demo-apps"

export default function CursorHighlightDemo() {
  return (
    <DemoWindow title="Cursor Highlight" tuiStyle={{ width: "100%", height: 260 }} cursorHighlight>
      <CursorHighlightApp />
    </DemoWindow>
  )
}
