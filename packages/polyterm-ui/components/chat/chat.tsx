import { useState, useRef } from "react"
import { textStyle } from "../text-style"

export interface ChatMessage {
  /** Unique identifier for the message. Used as a list key. */
  id: string
  /** Determines the prefix character and color. */
  role: "user" | "assistant"
  /** The message text content. */
  content: string
  /** Tool calls associated with this message (accepted but not rendered inline). */
  toolCalls?: ToolCallInfo[]
}

export interface ToolCallInfo {
  /** Unique identifier for the tool call. Used as a list key. */
  id: string
  /** Display name/description of the tool call. */
  title: string
  /** Current status, determines the icon and color. */
  status: "pending" | "in_progress" | "completed" | "failed"
  /** Result text from the tool call (accepted but not displayed). */
  result?: string
}

export interface ChatPanelProps {
  /** Array of messages to display. */
  messages: ChatMessage[]
  /** Partial text being streamed from the assistant. */
  streamingText?: string
  /** Whether the assistant is processing. */
  isLoading?: boolean
  /** Currently active tool calls to display as status cards. */
  activeToolCalls?: ToolCallInfo[]
  /** Callback fired when the user submits a message. */
  onSendMessage: (text: string) => void
  /** Callback for cancellation. Wired to Escape key when loading/streaming. */
  onCancel?: () => void
  /** Placeholder text shown in the input when empty. */
  placeholder?: string
  /** The prompt string shown before user input. */
  promptChar?: string
  /** Color of the prompt character in the input. */
  promptColor?: string
  /** Color of the > prefix on user messages. */
  userColor?: string
  /** Color of the < prefix on assistant messages and streaming text. */
  assistantColor?: string
  /** Text displayed when loading (and not streaming). */
  loadingText?: string
  /** Keyboard handler — pass useKeyboard from @opentui/react */
  useKeyboard?: (handler: (event: any) => void) => void
}

const STATUS_ICONS: Record<string, string> = {
  pending: "\u2022",
  in_progress: "\u280B",
  completed: "\u2713",
  failed: "\u2717",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "gray",
  in_progress: "yellow",
  completed: "green",
  failed: "red",
}

function MessageBubble({
  message,
  userColor = "green",
  assistantColor = "blue",
}: {
  message: ChatMessage
  userColor?: string
  assistantColor?: string
}) {
  const isUser = message.role === "user"
  const prefix = isUser ? "> " : "< "
  const color = isUser ? userColor : assistantColor

  return (
    <text wrapMode="word">
      <span style={textStyle({ bold: true, fg: color })}>{prefix}</span>
      <span>{message.content}</span>
    </text>
  )
}

function StreamingTextDisplay({
  text,
  assistantColor = "blue",
  cursorChar = "_",
}: {
  text: string
  assistantColor?: string
  cursorChar?: string
}) {
  if (!text) return null

  return (
    <text wrapMode="word">
      <span style={textStyle({ bold: true, fg: assistantColor })}>{"< "}</span>
      <span>{text}</span>
      <span style={textStyle({ dim: true })}>{cursorChar}</span>
    </text>
  )
}

function ToolCallCard({ toolCall }: { toolCall: ToolCallInfo }) {
  const icon = STATUS_ICONS[toolCall.status] || "\u2022"
  const color = STATUS_COLORS[toolCall.status] || "gray"
  const showEllipsis = toolCall.status === "pending" || toolCall.status === "in_progress"

  return (
    <text>
      <span>{"  "}</span>
      <span style={textStyle({ fg: color })}>{icon}</span>
      <span>{" "}</span>
      <span style={textStyle({ fg: color })}>{toolCall.title}</span>
      {showEllipsis && <span style={textStyle({ dim: true })}>{" ..."}</span>}
    </text>
  )
}

function ChatInput({
  onSubmit,
  placeholder = "Type a message...",
  prompt = "> ",
  promptColor = "green",
  disabled = false,
  useKeyboard,
}: {
  onSubmit: (text: string) => void
  placeholder?: string
  prompt?: string
  promptColor?: string
  disabled?: boolean
  useKeyboard?: (handler: (event: any) => void) => void
}) {
  const [value, setValue] = useState("")
  const valueRef = useRef("")

  const updateValue = (newValue: string) => {
    valueRef.current = newValue
    setValue(newValue)
  }

  useKeyboard?.((event: any) => {
    if (disabled) return

    if (event.name === "return") {
      const trimmed = valueRef.current.trim()
      if (trimmed) {
        onSubmit(trimmed)
        updateValue("")
      }
      return
    }

    if (event.name === "backspace" || event.name === "delete") {
      updateValue(valueRef.current.slice(0, -1))
      return
    }

    // Ignore ctrl/meta modified keys
    if (event.ctrl || event.meta) return

    // Only append printable characters (single char)
    if (event.name && event.name.length === 1) {
      updateValue(valueRef.current + event.name)
      return
    }

    // Handle space key
    if (event.name === "space") {
      updateValue(valueRef.current + " ")
      return
    }
  })

  const showPlaceholder = value.length === 0

  return (
    <text>
      <span style={textStyle({ fg: promptColor })}>{prompt}</span>
      {showPlaceholder ? (
        <>
          <span style={textStyle({ dim: true })}>{placeholder}</span>
          {!disabled && <span style={textStyle({ inverse: true })}>{" "}</span>}
        </>
      ) : (
        <>
          <span>{value}</span>
          {!disabled && <span style={textStyle({ inverse: true })}>{" "}</span>}
        </>
      )}
    </text>
  )
}

export function ChatPanel({
  messages,
  streamingText = "",
  isLoading = false,
  activeToolCalls = [],
  onSendMessage,
  onCancel,
  placeholder = "Type a message...",
  promptChar = "> ",
  promptColor = "green",
  userColor = "green",
  assistantColor = "blue",
  loadingText = "Thinking...",
  useKeyboard,
}: ChatPanelProps) {
  const inputDisabled = isLoading || !!streamingText

  // We need to split keyboard handling: escape goes to cancel, rest to ChatInput
  // To do this, we wrap useKeyboard to intercept escape
  const wrappedUseKeyboard = useKeyboard
    ? (handler: (event: any) => void) => {
        useKeyboard((event: any) => {
          // Escape triggers onCancel when loading/streaming
          if (event.name === "escape" && inputDisabled && onCancel) {
            onCancel()
            return
          }
          handler(event)
        })
      }
    : undefined

  return (
    <box flexDirection="column" paddingX={1}>
      {/* Messages */}
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          userColor={userColor}
          assistantColor={assistantColor}
        />
      ))}

      {/* Tool call cards */}
      {activeToolCalls.map((tc) => (
        <ToolCallCard key={tc.id} toolCall={tc} />
      ))}

      {/* Streaming text OR loading indicator */}
      {streamingText ? (
        <StreamingTextDisplay
          text={streamingText}
          assistantColor={assistantColor}
        />
      ) : isLoading ? (
        <text style={textStyle({ dim: true })}>{"  "}{loadingText}</text>
      ) : null}

      {/* Chat input with margin-top 1 */}
      <box marginTop={1}>
        <ChatInput
          onSubmit={onSendMessage}
          placeholder={placeholder}
          prompt={promptChar}
          promptColor={promptColor}
          disabled={inputDisabled}
          useKeyboard={wrappedUseKeyboard}
        />
      </box>
    </box>
  )
}
