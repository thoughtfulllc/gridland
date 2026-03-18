// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState, useEffect, useRef } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { Message, PromptInput, StatusBar } from "@gridland/ui"
import type { ChatStatus } from "@gridland/ui"
import { useKeyboard } from "@gridland/utils"

const RESPONSE = "I've refactored the auth module. The changes include extracting the token validation into a shared helper, consolidating the middleware chain, and updating the test suite to match."

type Phase = "idle" | "streaming" | "done"

function MessageDemoApp() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [streamedText, setStreamedText] = useState("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useKeyboard((event) => {
    if (event.name === "r") restart()
  })

  function restart() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPhase("idle")
    setStreamedText("")
  }

  useEffect(() => {
    if (phase === "idle") {
      timerRef.current = setTimeout(() => setPhase("streaming"), 800)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase])

  useEffect(() => {
    if (phase !== "streaming") return
    if (streamedText.length < RESPONSE.length) {
      timerRef.current = setTimeout(() => {
        setStreamedText(RESPONSE.slice(0, streamedText.length + 2))
      }, 25)
    } else {
      timerRef.current = setTimeout(() => setPhase("done"), 500)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase, streamedText])

  useEffect(() => {
    if (phase === "done") {
      timerRef.current = setTimeout(() => restart(), 3000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase])

  const isStreaming = phase === "streaming"
  const isDone = phase === "done"
  const showAssistant = phase !== "idle"

  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="column" padding={1} gap={1} flexGrow={1}>
        <Message role="user">
          <Message.Content>
            <Message.Text>Can you refactor the auth module?</Message.Text>
          </Message.Content>
        </Message>

        {showAssistant && (
          <Message role="assistant" isStreaming={isStreaming}>
            <Message.Content>
              <Message.Text isLast>{isDone ? RESPONSE : streamedText}</Message.Text>
            </Message.Content>
          </Message>
        )}
      </box>

      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[
          { key: "r", label: "restart" },
        ]} />
      </box>
    </box>
  )
}

export default function MessageDemo() {
  return (
    <DemoWindow title="Message" tuiStyle={{ width: "100%", height: 300 }}>
      <MessageDemoApp />
    </DemoWindow>
  )
}

// ── Message + PromptInput demo (OpenRouter via Vercel) ───────────────

import { useChat } from "@ai-sdk/react"
import { chatTransport } from "@/lib/chat"
import { renderContentParts } from "./render-message-parts-demo-utils"

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
              <Message.Content>
                {msg.parts?.length
                  ? renderContentParts(msg.parts, msgStreaming)
                  : typeof msg.content === "string"
                    ? <Message.Text isLast={msgStreaming}>{msg.content}</Message.Text>
                    : null
                }
              </Message.Content>
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
