// @ts-nocheck
import { useState } from "react"
import { useKeyboard } from "@gridland/utils"
import { MultiSelect, StatusBar } from "@gridland/ui"

const items = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
  { label: "Rust", value: "rs" },
]

export function MultiSelectApp() {
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
        <MultiSelect
          key={resetKey}
          items={items}
          title="Select languages"
          useKeyboard={useKeyboard}
          onSubmit={() => setSubmitted(true)}
        />
      </box>
      <StatusBar items={submitted
        ? [{ key: "r", label: "reset demo" }]
        : [
          { key: "↑↓", label: "move" },
          { key: "enter", label: "select" },
          { key: "a", label: "all" },
          { key: "x", label: "clear" },
        ]
      } />
    </box>
  )
}
