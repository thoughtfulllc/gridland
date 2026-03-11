// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { TextInput, StatusBar, textStyle, useTheme } from "@gridland/ui"
import { useKeyboard } from "@opentui/react"

// ── State Picker ──────────────────────────────────────────────────────────

const STATES = [
  { name: "default", props: { focus: true } },
  { name: "read only", props: {} },
  { name: "required", props: { focus: true, required: true } },
  { name: "error", props: { focus: true, error: "This field is required" } },
  { name: "description", props: { focus: true, description: "Enter your display name" } },
  { name: "disabled", props: { disabled: true } },
  { name: "maxLength", props: { focus: true, value: "John Doe", maxLength: 15 } },
]

function TextInputPickerApp() {
  const theme = useTheme()
  const [selected, setSelected] = useState(0)

  useKeyboard((event) => {
    if (event.name === "left") setSelected((s) => (s > 0 ? s - 1 : STATES.length - 1))
    if (event.name === "right") setSelected((s) => (s < STATES.length - 1 ? s + 1 : 0))
  })

  const state = STATES[selected]

  return (
    <box flexDirection="column" flexGrow={1}>
      <box paddingLeft={1} paddingRight={2} paddingTop={1} paddingBottom={2} flexDirection="column" flexGrow={1}>
        <TextInput label="Username" placeholder="enter your name" prompt="> " focus={false} {...state.props} />
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar
          items={[{ key: "←→", label: "change state" }]}
          extra={<span style={textStyle({ fg: theme.accent, bold: true })}>{state.name.padEnd(12)}</span>}
        />
      </box>
    </box>
  )
}

// ── Form Demo ─────────────────────────────────────────────────────────────

const FIELDS = [
  { label: "Username", placeholder: "enter your name", maxLength: 30, required: true },
  { label: "Email", placeholder: "user@example.com", maxLength: 50, required: true, description: "We'll never share your email" },
  { label: "Password", placeholder: "enter password", maxLength: 40 },
  { label: "API Key", placeholder: "sk-...", maxLength: 60, disabled: true },
]

function TextInputFormApp() {
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
        <StatusBar items={[
          { key: "↑↓", label: "field" },
        ]} />
      </box>
    </box>
  )
}

// ── Exports ───────────────────────────────────────────────────────────────

export function TextInputPickerDemo() {
  return (
    <DemoWindow title="TextInput" tuiStyle={{ width: "100%", height: 200 }}>
      <TextInputPickerApp />
    </DemoWindow>
  )
}

export default function TextInputDemo() {
  return (
    <DemoWindow title="TextInput" tuiStyle={{ width: "100%", height: 360 }}>
      <TextInputFormApp />
    </DemoWindow>
  )
}
