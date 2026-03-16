// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { Message, PromptInput } from "@gridland/ui"
import type { ChatStatus } from "@gridland/ui"
import { useKeyboard } from "@gridland/utils"
import { useChat } from "@ai-sdk/react"
import { renderPartsWithReasoning } from "./render-message-parts-demo-utils"

function AIChatInterfaceApp() {
  const [expanded, setExpanded] = useState(true)

  const { messages, status, sendMessage, stop } = useChat({
    api: process.env.NEXT_PUBLIC_CHAT_API_URL ?? "/api/chat",
  })

  useKeyboard((event) => {
    if (event.name === "E" && event.ctrl && event.shift) setExpanded((v) => !v)
  })

  const chatStatus: ChatStatus =
    status === "streaming" ? "streaming"
    : status === "submitted" ? "submitted"
    : status === "error" ? "error"
    : "ready"

  const isStreaming = status === "streaming"

  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="column" paddingX={1} gap={1} flexGrow={1} overflow="hidden" justifyContent="flex-end">
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1
          const msgStreaming = isLast && msg.role === "assistant" && isStreaming

          if (msg.parts?.length) {
            const { reasoning, content } = renderPartsWithReasoning(msg.parts, msgStreaming, { expanded })
            return (
              <Message
                key={msg.id}
                role={msg.role as "user" | "assistant"}
                isStreaming={msgStreaming}
              >
                {reasoning}
                <Message.Content>{content}</Message.Content>
              </Message>
            )
          }

          return (
            <Message
              key={msg.id}
              role={msg.role as "user" | "assistant"}
              isStreaming={msgStreaming}
            >
              <Message.Content>
                {typeof msg.content === "string" && (
                  <Message.Text isLast={msgStreaming}>{msg.content}</Message.Text>
                )}
              </Message.Content>
            </Message>
          )
        })}
      </box>
      <box flexShrink={0}>
        <PromptInput
          onSubmit={sendMessage}
          onStop={stop}
          status={chatStatus}
          placeholder="Type a message..."
          useKeyboard={useKeyboard}
          showDividers
        />
      </box>
    </box>
  )
}

export default function AIChatInterfaceDemo() {
  return (
    <DemoWindow title="AI Chat Interface" tuiStyle={{ width: "100%", height: 480 }}>
      <AIChatInterfaceApp />
    </DemoWindow>
  )
}
