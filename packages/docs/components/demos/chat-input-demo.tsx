// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { ChatInput, StatusBar, Modal, SelectInput, textStyle } from "@gridland/ui"
import { useKeyboard } from "@opentui/react"

const commands = [
  { cmd: "/help", desc: "Show commands" },
  { cmd: "/model", desc: "Switch model" },
  { cmd: "/clear", desc: "Clear conversation" },
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

function ChatInputApp() {
  const [lastMessage, setLastMessage] = useState("")
  const [model, setModel] = useState("opus")
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  const handleSubmit = (text: string) => {
    if (text === "/model") {
      setShowModelPicker(true)
      setResetKey((k) => k + 1)
      return
    }
    if (text === "/clear") {
      setLastMessage("")
      setResetKey((k) => k + 1)
      return
    }
    setLastMessage(text)
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
            <span>{"Sent: "}</span>
            <span>{lastMessage}</span>
          </text>
        ) : (
          <text>
            <span>{" "}</span>
          </text>
        )}
      </box>
      <ChatInput
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
          <span style={textStyle({ fg: "#C4A8FF" })}>{"[⊡_⊡]"}</span>
          <span style={textStyle({ dim: true })}>{" " + model}</span>
        </text>
      </box>
      <StatusBar items={[
        { key: "⏎", label: "send" },
        { key: "/", label: "commands" },
        { key: "@", label: "files" },
        { key: "↑", label: "history" },
      ]} />
    </box>
  )
}

export default function ChatInputDemo() {
  return (
    <DemoWindow title="ChatInput" tuiStyle={{ width: "100%", height: 200 }}>
      <ChatInputApp />
    </DemoWindow>
  )
}
