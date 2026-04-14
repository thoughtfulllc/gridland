// @ts-nocheck
"use client"
import { useState } from "react"
import { FocusProvider, useKeyboard, useFocusedShortcuts } from "@gridland/utils"
import { SelectInput, StatusBar } from "@gridland/ui"

const items = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
  { label: "Rust", value: "rs" },
]

function SelectInputDemo() {
  const [submitted, setSubmitted] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const shortcuts = useFocusedShortcuts()

  // Reset is a global, app-level action — always fire when 'r' is pressed
  // after submission, regardless of focus state.
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
        <SelectInput
          key={resetKey}
          focusId="language"
          autoFocus
          items={items}
          title="Choose a language"
          onSubmit={() => setSubmitted(true)}
        />
      </box>
      <StatusBar
        items={submitted ? [{ key: "r", label: "reset demo" }] : shortcuts}
      />
    </box>
  )
}

export function SelectInputApp() {
  return (
    <FocusProvider selectable>
      <SelectInputDemo />
    </FocusProvider>
  )
}
