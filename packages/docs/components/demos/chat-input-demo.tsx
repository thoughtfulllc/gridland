// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { ChatInput, StatusBar } from "@gridland/ui"
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

function ChatInputApp() {
  const [lastMessage, setLastMessage] = useState("")

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
        commands={commands}
        files={files}
        placeholder="Message Claude..."
        useKeyboard={useKeyboard}
        onSubmit={(text) => setLastMessage(text)}
      />
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
