// @ts-nocheck
"use client"
import { useState } from "react"
import { FocusProvider, useKeyboard, useFocusedShortcuts } from "@gridland/utils"
import { MultiSelect, StatusBar } from "@gridland/ui"

const items = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
  { label: "Rust", value: "rs" },
]

function MultiSelectDemo() {
  const [submitted, setSubmitted] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const shortcuts = useFocusedShortcuts()

  useKeyboard(
    (event) => {
      if (submitted && event.name === "r") {
        setSubmitted(false)
        setResetKey((k) => k + 1)
      }
    },
    { global: true },
  )

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box flexDirection="column" flexGrow={1}>
        <MultiSelect
          key={resetKey}
          focusId="languages"
          autoFocus
          items={items}
          title="Select languages"
          onSubmit={() => setSubmitted(true)}
        />
      </box>
      <StatusBar
        items={submitted ? [{ key: "r", label: "reset demo" }] : shortcuts}
      />
    </box>
  )
}

export function MultiSelectApp() {
  return (
    <FocusProvider selectable>
      <MultiSelectDemo />
    </FocusProvider>
  )
}
