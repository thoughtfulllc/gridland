// @ts-nocheck
"use client"
import { DemoWindow } from "@/components/ui/demo-window"
import { MessageApp } from "@demos/message"

export default function MessageDemo() {
  return (
    <DemoWindow title="Message" tuiStyle={{ width: "100%", height: 300 }}>
      <MessageApp />
    </DemoWindow>
  )
}

// ── Message + PromptInput demo (OpenRouter via Vercel, docs-only) ───────

import { Message, MessageContent, MessageText, PromptInput } from "@gridland/ui"
import type { ChatStatus } from "@gridland/ui"
import { useKeyboard } from "@gridland/utils"
import { useChat } from "@ai-sdk/react"
import { chatTransport } from "@/lib/chat"
import { renderContentParts } from "@demos/render-message-parts-demo-utils"

function MessageWithInputApp() {
  const { messages, status, sendMessage, stop } = useChat({
    transport: chatTransport,
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

          return (
            <Message
              key={msg.id}
              role={msg.role as "user" | "assistant"}
              isStreaming={msgStreaming}
            >
              <MessageContent>
                {msg.parts?.length
                  ? renderContentParts(msg.parts, msgStreaming)
                  : typeof msg.content === "string"
                    ? <MessageText>{msg.content}</MessageText>
                    : null
                }
              </MessageContent>
            </Message>
          )
        })}
      </box>
      <PromptInput
        onSubmit={sendMessage}
        onStop={stop}
        status={chatStatus}
        placeholder="Type a message..."
        useKeyboard={useKeyboard}
        showDividers
      />
    </box>
  )
}

export function MessageWithInputDemo() {
  return (
    <DemoWindow title="Message + PromptInput" tuiStyle={{ width: "100%", height: 400 }}>
      <MessageWithInputApp />
    </DemoWindow>
  )
}
