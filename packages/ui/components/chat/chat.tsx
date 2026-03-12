import { textStyle } from "../text-style"
import { useTheme } from "../theme/index"
import type { Theme } from "../theme/index"
import { PromptInput } from "../prompt-input/prompt-input"
import type { ChatStatus } from "../prompt-input/prompt-input"

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
  /**
   * AI chat status — drives loading/streaming/error states.
   * When provided, takes precedence over `isLoading`.
   * - `ready`: input enabled
   * - `submitted`: shows loading indicator, input disabled
   * - `streaming`: shows streaming text, input disabled, Esc calls onStop
   * - `error`: input enabled, shows error state
   */
  status?: ChatStatus
  /** Whether the assistant is processing. Ignored when `status` is provided. */
  isLoading?: boolean
  /** Currently active tool calls to display as status cards. */
  activeToolCalls?: ToolCallInfo[]
  /** Callback fired when the user submits a message. */
  onSendMessage: (text: string) => void
  /** Callback to stop generation. Wired to Escape key during streaming. */
  onStop?: () => void
  /** Callback for cancellation. Wired to Escape key when loading/streaming. @deprecated Use `onStop` instead. */
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

function getStatusColors(theme: Theme): Record<string, string> {
  return {
    pending: theme.muted,
    in_progress: theme.warning,
    completed: theme.success,
    failed: theme.error,
  }
}

function MessageBubble({
  message,
  userColor,
  assistantColor,
}: {
  message: ChatMessage
  userColor: string
  assistantColor: string
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
  assistantColor,
  cursorChar = "_",
}: {
  text: string
  assistantColor: string
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

function ToolCallCard({ toolCall, statusColors }: { toolCall: ToolCallInfo; statusColors: Record<string, string> }) {
  const icon = STATUS_ICONS[toolCall.status] || "\u2022"
  const color = statusColors[toolCall.status] || "gray"
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

export function ChatPanel({
  messages,
  streamingText = "",
  status,
  isLoading = false,
  activeToolCalls = [],
  onSendMessage,
  onStop,
  onCancel,
  placeholder = "Type a message...",
  promptChar = "> ",
  promptColor,
  userColor,
  assistantColor,
  loadingText = "Thinking...",
  useKeyboard: useKeyboardProp,
}: ChatPanelProps) {
  const theme = useTheme()
  const resolvedUserColor = userColor ?? theme.secondary
  const resolvedAssistantColor = assistantColor ?? theme.primary
  const resolvedPromptColor = promptColor ?? theme.secondary
  const statusColors = getStatusColors(theme)

  // Derive chat status from props
  const chatStatus: ChatStatus | undefined = status
    ? status
    : isLoading && !streamingText ? "submitted"
    : streamingText ? "streaming"
    : undefined

  const isSubmitted = chatStatus === "submitted"
  const isStreaming = chatStatus === "streaming"
  const stopHandler = onStop ?? onCancel

  return (
    <box flexDirection="column" paddingX={1}>
      {/* Messages */}
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          userColor={resolvedUserColor}
          assistantColor={resolvedAssistantColor}
        />
      ))}

      {/* Tool call cards */}
      {activeToolCalls.map((tc) => (
        <ToolCallCard key={tc.id} toolCall={tc} statusColors={statusColors} />
      ))}

      {/* Streaming text OR loading indicator */}
      {isStreaming && streamingText ? (
        <StreamingTextDisplay
          text={streamingText}
          assistantColor={resolvedAssistantColor}
        />
      ) : isSubmitted ? (
        <text style={textStyle({ dim: true })}>{"  "}{loadingText}</text>
      ) : null}

      {/* Input */}
      <box marginTop={1}>
        <PromptInput
          onSubmit={(msg) => onSendMessage(msg.text)}
          onStop={stopHandler}
          status={chatStatus}
          placeholder={placeholder}
          prompt={promptChar}
          promptColor={resolvedPromptColor}
          submittedText={loadingText}
          useKeyboard={useKeyboardProp}
        />
      </box>
    </box>
  )
}
