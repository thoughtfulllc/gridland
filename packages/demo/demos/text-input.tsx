// @ts-nocheck
import { useState } from "react"
import { FocusProvider, useFocusedShortcuts } from "@gridland/utils"
import { TextInput, StatusBar } from "@gridland/ui"

const FIELDS = [
  { id: "username", label: "Username", placeholder: "enter your name", maxLength: 30, required: true },
  { id: "email", label: "Email", placeholder: "user@example.com", maxLength: 50, required: true, description: "We'll never share your email" },
  { id: "password", label: "Password", placeholder: "enter password", maxLength: 40 },
  { id: "apikey", label: "API Key", placeholder: "sk-...", maxLength: 60, disabled: true },
] as const

function TextInputDemo() {
  const [values, setValues] = useState(FIELDS.map(() => ""))
  const shortcuts = useFocusedShortcuts()

  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="column" paddingX={1} paddingTop={1} flexGrow={1}>
        {FIELDS.map((field, i) => (
          <box key={field.id} marginBottom={1}>
            <TextInput
              focusId={field.id}
              autoFocus={i === 0}
              label={field.label}
              placeholder={field.placeholder}
              prompt="> "
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
        <StatusBar items={shortcuts} />
      </box>
    </box>
  )
}

export function TextInputApp() {
  return (
    <FocusProvider selectable>
      <TextInputDemo />
    </FocusProvider>
  )
}
