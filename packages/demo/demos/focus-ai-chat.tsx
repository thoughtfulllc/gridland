// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { useState, useRef, useCallback } from "react"
import { Message, PromptInput, StatusBar } from "@gridland/ui"
import { useKeyboard, useFocus, FocusProvider, useShortcuts, useFocusedShortcuts } from "@gridland/utils"
import { useChat } from "@ai-sdk/react"
import { renderPartsWithReasoning, toChatStatus } from "./render-message-parts-demo-utils"

const FOCUS_COLORS = {
  selected: "#818cf8",
  focused: "#6366f1",
  idle: "#3b3466",
} as const

function MessageArea({ messages, isStreaming, expanded }: {
  messages: any[]
  isStreaming: boolean
  expanded: boolean
}) {
  const { isFocused, isSelected, isAnySelected, focusId, focusRef } = useFocus({ id: "messages", autoFocus: true })

  useShortcuts(
    isSelected
      ? [{ key: "esc", label: "back" }]
      : [{ key: "↑↓", label: "navigate" }, { key: "tab", label: "cycle" }, { key: "enter", label: "select" }],
    focusId,
  )

  const borderColor = isSelected ? FOCUS_COLORS.selected
    : isAnySelected ? "transparent"
    : isFocused ? FOCUS_COLORS.focused
    : "transparent"

  return (
    <box
      ref={focusRef}
      flexDirection="column"
      paddingX={1}
      gap={1}
      flexGrow={1}
      overflow="hidden"
      justifyContent="flex-end"
      border
      borderStyle={isFocused && !isSelected ? "dashed" as const : "rounded" as const}
      borderColor={borderColor}
    >
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
  )
}

function PromptSection({ onSubmit, onStop, chatStatus }: {
  onSubmit: (msg: string) => void
  onStop: () => void
  chatStatus: ChatStatus
}) {
  const { isFocused, isSelected, isAnySelected, focusId, focusRef } = useFocus({ id: "prompt" })
  const promptHandlerRef = useRef<((event: any) => void) | null>(null)

  const captureKeyboard = useCallback((handler: (event: any) => void) => {
    promptHandlerRef.current = handler
  }, [])

  useKeyboard((event) => {
    promptHandlerRef.current?.(event)
  }, { focusId, selectedOnly: true })

  useShortcuts(
    isSelected
      ? [{ key: "⏎", label: "send" }, { key: "esc", label: "back" }]
      : [{ key: "↑↓", label: "navigate" }, { key: "tab", label: "cycle" }, { key: "enter", label: "select" }],
    focusId,
  )

  const dividerColor = isSelected ? FOCUS_COLORS.selected
    : isAnySelected ? undefined
    : isFocused ? FOCUS_COLORS.focused
    : FOCUS_COLORS.idle
  const dividerDashed = isFocused && !isSelected && !isAnySelected

  return (
    <box ref={focusRef}>
      <PromptInput
        onSubmit={onSubmit}
        onStop={onStop}
        status={chatStatus}
        placeholder="Type a message..."
        dividerColor={dividerColor}
        dividerDashed={dividerDashed}
        useKeyboard={captureKeyboard}
        showDividers
      />
    </box>
  )
}

function FocusAIChatStatusBar() {
  const shortcuts = useFocusedShortcuts()
  return (
    <box paddingX={1} paddingBottom={1}>
      <StatusBar items={shortcuts} />
    </box>
  )
}

export function FocusAIChatApp({ transport }: { transport: any }) {
  const [expanded, setExpanded] = useState(true)

  const { messages, status, sendMessage, stop } = useChat({
    transport,
  })

  useKeyboard((event) => {
    if (event.name === "E" && event.ctrl && event.shift) setExpanded((v) => !v)
  })

  const chatStatus = toChatStatus(status)

  const isStreaming = status === "streaming"

  return (
    <FocusProvider selectable>
      <box flexDirection="column" flexGrow={1}>
        <box flexDirection="column" flexGrow={1}>
          <MessageArea messages={messages} isStreaming={isStreaming} expanded={expanded} />
          <PromptSection onSubmit={sendMessage} onStop={stop} chatStatus={chatStatus} />
        </box>
        <FocusAIChatStatusBar />
      </box>
    </FocusProvider>
  )
}
