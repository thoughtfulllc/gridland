// @ts-nocheck
import { useState } from "react"
import { useKeyboard } from "@gridland/utils"
import { TextInput, StatusBar } from "@gridland/ui"

const FIELDS = [
  { label: "Username", placeholder: "enter your name", maxLength: 30, required: true },
  { label: "Email", placeholder: "user@example.com", maxLength: 50, required: true, description: "We'll never share your email" },
  { label: "Password", placeholder: "enter password", maxLength: 40 },
  { label: "API Key", placeholder: "sk-...", maxLength: 60, disabled: true },
] as const

export function TextInputApp() {
  const [activeField, setActiveField] = useState(0)
  const [values, setValues] = useState(FIELDS.map(() => ""))

  useKeyboard((event) => {
    if (event.name === "up") setActiveField((i) => Math.max(0, i - 1))
    if (event.name === "down") setActiveField((i) => Math.min(FIELDS.length - 1, i + 1))
  })

  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="column" paddingX={1} paddingTop={1} flexGrow={1}>
        {FIELDS.map((field, i) => (
          <box key={field.label} marginBottom={1}>
            <TextInput
              label={field.label}
              placeholder={field.placeholder}
              prompt="> "
              focus={i === activeField}
              maxLength={field.maxLength}
              value={values[i]}
              onChange={(v) => setValues((prev) => prev.map((old, j) => j === i ? v : old))}
              required={field.required}
              disabled={field.disabled}
              description={field.description}
            />
          </box>
        ))}
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "↑↓", label: "field" }]} />
      </box>
    </box>
  )
}
