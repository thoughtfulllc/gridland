// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { useKeyboard } from "@gridland/utils"
import { Spinner, SpinnerPicker, SpinnerShowcase } from "@gridland/ui"

function SpinnerPickerContent() {
  return <SpinnerPicker useKeyboard={useKeyboard} />
}

export default function SpinnerPickerDemo() {
  return (
    <DemoWindow title="Spinner" tuiStyle={{ width: "100%", height: 140 }}>
      <SpinnerPickerContent />
    </DemoWindow>
  )
}

export function SpinnerShowcaseDemo() {
  return (
    <DemoWindow title="Spinner" tuiStyle={{ width: "100%", height: 180 }}>
      <SpinnerShowcase />
    </DemoWindow>
  )
}

export function SpinnerBasicDemo() {
  return (
    <DemoWindow title="Spinner" tuiStyle={{ width: "100%", height: 60 }}>
      <box padding={1}>
        <Spinner text="Loading..." />
      </box>
    </DemoWindow>
  )
}

export function SpinnerVariantsDemo() {
  return (
    <DemoWindow title="Spinner" tuiStyle={{ width: "100%", height: 100 }}>
      <box padding={1}>
        <Spinner variant="bloom" text="Fetching data..." />
        <Spinner variant="pulse" text="Building" color="#05FFA1" />
        <Spinner variant="ellipsis" text="Please wait" />
      </box>
    </DemoWindow>
  )
}
