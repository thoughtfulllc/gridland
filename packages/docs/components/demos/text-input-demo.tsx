// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { TextInput, StatusBar, textStyle } from "@gridland/ui"
import { useKeyboard } from "@opentui/react"

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
    if (event.name === "down" || event.name === "tab") setActiveField((i) => Math.min(FIELDS.length - 1, i + 1))
  })

  return (
    <box flexDirection="column" flexGrow={1}>
      <box paddingX={1} paddingTop={1}>
        <text>
          <span style={textStyle({ fg: "#FF71CE", bold: true })}>{"TextInput"}</span>
          <span style={textStyle({ dim: true })}>{"  Form with multiple input types"}</span>
        </text>
      </box>

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

      <StatusBar items={[
        { key: "↑↓", label: "field" },
        { key: "←→", label: "cursor" },
        { key: "tab", label: "next" },
        { key: "^k/^u", label: "kill" },
      ]} />
    </box>
  )
}

export default function TextInputDemo() {
  return (
    <DemoWindow title="TextInput" tuiStyle={{ width: "100%", height: 360 }}>
      <TextInputFormApp />
    </DemoWindow>
  )
}
