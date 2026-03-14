// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { PromptInput, StatusBar, Modal, SelectInput, textStyle, useTheme } from "@gridland/ui"
import { useKeyboard } from "@opentui/react"

const commands = [
  { cmd: "/model", desc: "Switch model" },
]

const files = [
  "src/index.ts",
  "src/routes.ts",
  "src/auth.ts",
  "package.json",
]

const models = [
  { label: "Claude Opus", value: "opus" },
  { label: "Claude Sonnet", value: "sonnet" },
  { label: "Claude Haiku", value: "haiku" },
]

function PromptInputApp() {
  const theme = useTheme()
  const [lastMessage, setLastMessage] = useState("")
  const [model, setModel] = useState("opus")
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  const handleSubmit = (msg: { text: string }) => {
    if (msg.text === "/model") {
      setShowModelPicker(true)
      setResetKey((k) => k + 1)
      return
    }
    setLastMessage(msg.text)
  }

  if (showModelPicker) {
    return (
      <box flexDirection="column" flexGrow={1} padding={1}>
        <Modal
          title="Select Model"
          useKeyboard={useKeyboard}
          onClose={() => setShowModelPicker(false)}
        >
          <box paddingX={1}>
            <SelectInput
              items={models}
              defaultValue={model}
              useKeyboard={useKeyboard}
              onSubmit={(value) => {
                setModel(value)
                setShowModelPicker(false)
              }}
            />
          </box>
        </Modal>
      </box>
    )
  }

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box flexDirection="column" flexGrow={1}>
        {lastMessage ? (
          <text>
            <span style={textStyle({ fg: theme.muted })}>{"Sent: "}</span>
            <span style={textStyle({ fg: theme.foreground })}>{lastMessage}</span>
          </text>
        ) : (
          <text>
            <span>{" "}</span>
          </text>
        )}
      </box>
      <PromptInput
        key={resetKey}
        commands={commands}
        files={files}
        placeholder="Message Claude..."
        showDividers
        useKeyboard={useKeyboard}
        onSubmit={handleSubmit}
      />
      <box>
        <text>
          <span style={textStyle({ dim: true })}>{"model: " + model}</span>
        </text>
      </box>
      <box paddingTop={1} paddingLeft={1} paddingBottom={1}>
        <StatusBar items={[
          { key: "⏎ enter", label: "send" },
          { key: "/model", label: "change model" },
          { key: "↑", label: "history" },
        ]} />
      </box>
    </box>
  )
}

export default function PromptInputDemo() {
  return (
    <DemoWindow title="PromptInput" tuiStyle={{ width: "100%", height: 300 }}>
      <PromptInputApp />
    </DemoWindow>
  )
}
