// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { SideNavApp } from "@demos/side-nav"

export default function SideNavDemo() {
  return (
    <DemoWindow title="SideNav" tuiStyle={{ width: "100%", height: 300 }} autoFocus>
      <SideNavApp />
    </DemoWindow>
  )
}
