// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { SelectInput, StatusBar } from "@gridland/ui"
import { useKeyboard } from "@gridland/utils"

const items = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
  { label: "Rust", value: "rs" },
]

function SelectInputApp() {
  const [submitted, setSubmitted] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  useKeyboard((event) => {
    if (submitted && event.name === "r") {
      setSubmitted(false)
      setResetKey((k) => k + 1)
    }
  })

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box flexDirection="column" flexGrow={1}>
        <SelectInput
          key={resetKey}
          items={items}
          title="Choose a language"
          useKeyboard={useKeyboard}
          onSubmit={() => setSubmitted(true)}
        />
      </box>
      <StatusBar items={submitted
        ? [{ key: "r", label: "reset demo" }]
        : [
          { key: "↑↓", label: "select" },
          { key: "enter", label: "submit" },
        ]
      } />
    </box>
  )
}

export default function SelectInputDemo() {
  return (
    <DemoWindow title="SelectInput" tuiStyle={{ width: "100%", height: 240 }}>
      <SelectInputApp />
    </DemoWindow>
  )
}
