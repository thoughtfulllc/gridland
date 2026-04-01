import { createContext, useContext } from "react"
import type { ReactNode } from "react"
import { textStyle } from "./text-style"
import { useTheme } from "./theme"
import type { Theme } from "./theme"
import { ChainOfThought, ChainOfThoughtHeader, ChainOfThoughtContent, ChainOfThoughtStep, type Step } from "./chain-of-thought"
export type { Step } from "./chain-of-thought"

// ── Part types (optional helpers — not coupled to sub-components) ──

export type TextPart = {
  type: "text"
  text: string
}

export type ReasoningPart = {
  type: "reasoning"
  text?: string
  duration?: string
  steps?: Step[]
  collapsed?: boolean
}

export type ToolCallState = "pending" | "running" | "completed" | "error"

export type ToolCallPart = {
  type: "tool-call"
  name: string
  state: ToolCallState
  args?: unknown
  result?: unknown
}

export type SourcePart = {
  type: "source"
  title?: string
  url?: string
}

export type MessagePart = TextPart | ReasoningPart | ToolCallPart | SourcePart

// ── Role ────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system"

// ── Context ─────────────────────────────────────────────────────────

export interface MessageContextValue {
  role: MessageRole
  isStreaming: boolean
  streamingCursor: string
  backgroundColor: string
  textColor: string
}

const MessageContext = createContext<MessageContextValue | null>(null)

export function useMessage(): MessageContextValue {
  const ctx = useContext(MessageContext)
  if (!ctx) throw new Error("useMessage must be used within <Message>")
  return ctx
}

// ── Style helpers ───────────────────────────────────────────────────

const LIGHT_THEME_BACKGROUND = "#FFFFFF"
const BUBBLE_COLORS = {
  dark: { assistantBg: "#2a2a4a", userBg: "#2a3a3a" },
  light: { assistantBg: "#F1F5F9", userBg: "#E2E8F0" },
} as const

function getBubbleColors(theme: Theme): { assistantBg: string; userBg: string } {
  const isDark = theme.background !== LIGHT_THEME_BACKGROUND
  return isDark ? BUBBLE_COLORS.dark : BUBBLE_COLORS.light
}

const TOOL_STATE_ICONS: Record<ToolCallState, string> = {
  pending: "\u2022",   // •
  running: "\u280B",   // ⠋
  completed: "\u2713", // ✓
  error: "\u2715",     // ✕
}

function getToolStateColor(state: ToolCallState, theme: Theme): string {
  switch (state) {
    case "pending": return theme.muted
    case "running": return theme.warning
    case "completed": return theme.success
    case "error": return theme.error
  }
}

// ── Sub-components ──────────────────────────────────────────────────

/** Bubble wrapper with background color. Reads bg from Message context. */
function MessageContent({ children }: { children: ReactNode }) {
  const { role, backgroundColor } = useMessage()
  const isUser = role === "user"

  return (
    <box
      flexDirection="column"
      backgroundColor={backgroundColor}
      paddingX={2}
      paddingY={1}
      {...(isUser ? { maxWidth: "85%" } : { width: "85%" })}
    >
      {children}
    </box>
  )
}

/** Renders text with word wrap. Pass `isLast` to show the streaming cursor. */
function MessageText({ children, isLast = false }: {
  children: string
  isLast?: boolean
}) {
  const { isStreaming, streamingCursor, backgroundColor, textColor } = useMessage()

  return (
    <text wrapMode="word">
      <span style={textStyle({ fg: textColor, bg: backgroundColor })}>{children}</span>
      {isLast && isStreaming && (
        <span style={textStyle({ fg: textColor, dim: true, bg: backgroundColor })}>{streamingCursor}</span>
      )}
    </text>
  )
}

/** Collapsible reasoning block rendered as a ChainOfThought. */
function MessageReasoning({ duration, steps, collapsed = true, children }: {
  /** Duration label shown in the header */
  duration?: string
  /** Structured thinking steps */
  steps?: Step[]
  /** Whether the block starts collapsed */
  collapsed?: boolean
  /** Freeform content (used when steps are not provided) */
  children?: ReactNode
}) {
  return (
    <ChainOfThought defaultOpen={!collapsed}>
      <ChainOfThoughtHeader duration={duration} />
      <ChainOfThoughtContent>
        {steps?.map((step, i) => (
          <ChainOfThoughtStep
            key={i}
            label={step.label}
            description={step.description}
            status={step.status}
            isLast={i === (steps?.length ?? 0) - 1}
          >
            {step.output}
          </ChainOfThoughtStep>
        ))}
        {children}
      </ChainOfThoughtContent>
    </ChainOfThought>
  )
}

/** Tool call with status icon and optional result. */
function MessageToolCall({ name, state = "pending", result, color }: {
  /** Tool name */
  name: string
  /** Tool execution state */
  state?: ToolCallState
  /** Tool result (shown when state is "completed") */
  result?: unknown
  /** Override the default state color */
  color?: string
}) {
  const theme = useTheme()
  const { backgroundColor, textColor } = useMessage()
  const icon = TOOL_STATE_ICONS[state]
  const stateColor = color ?? getToolStateColor(state, theme)
  const isActive = state === "pending" || state === "running"

  return (
    <box flexDirection="column">
      <text>
        <span style={textStyle({ fg: stateColor, bg: backgroundColor })}>{icon}</span>
        <span style={textStyle({ fg: textColor, bg: backgroundColor })}>{" "}</span>
        <span style={textStyle({ fg: stateColor, bold: isActive, bg: backgroundColor })}>{name}</span>
        {isActive && <span style={textStyle({ fg: textColor, dim: true, bg: backgroundColor })}>{" ..."}</span>}
      </text>
      {state === "completed" && result !== undefined && (
        <text>
          <span style={textStyle({ fg: textColor, dim: true, bg: backgroundColor })}>{"  \u2514\u2500 "}</span>
          <span style={textStyle({ fg: textColor, dim: true, bg: backgroundColor })}>{String(result).slice(0, 120)}</span>
        </text>
      )}
      {state === "error" && result !== undefined && (
        <text>
          <span style={textStyle({ fg: theme.error, dim: true, bg: backgroundColor })}>{"  \u2514\u2500 "}</span>
          <span style={textStyle({ fg: theme.error, dim: true, bg: backgroundColor })}>{String(result).slice(0, 120)}</span>
        </text>
      )}
    </box>
  )
}

/** Numbered source citation. */
function MessageSource({ title, url, index }: {
  /** Source title */
  title?: string
  /** Source URL */
  url?: string
  /** Zero-based index for the citation number */
  index: number
}) {
  const theme = useTheme()
  const { backgroundColor, textColor } = useMessage()
  const displayTitle = title || url || "source"

  return (
    <text>
      <span style={textStyle({ fg: textColor, dim: true, bg: backgroundColor })}>{"["}</span>
      <span style={textStyle({ fg: theme.accent, bg: backgroundColor })}>{String(index + 1)}</span>
      <span style={textStyle({ fg: textColor, dim: true, bg: backgroundColor })}>{"] "}</span>
      <span style={textStyle({ fg: theme.accent, bg: backgroundColor })}>{displayTitle}</span>
    </text>
  )
}

/** Model attribution and timestamp footer. */
function MessageFooter({ model, timestamp }: {
  model?: string
  timestamp?: string
}) {
  const theme = useTheme()
  if (!model && !timestamp) return null

  return (
    <text>
      {model && <span style={textStyle({ dim: true, fg: theme.muted })}>{model}</span>}
      {model && timestamp && <span style={textStyle({ dim: true, fg: theme.muted })}>{" \u00B7 "}</span>}
      {timestamp && <span style={textStyle({ dim: true, fg: theme.muted })}>{timestamp}</span>}
    </text>
  )
}

// ── Message (root component) ────────────────────────────────────────

export interface MessageProps {
  /** Message role — determines alignment and default background. */
  role: MessageRole
  /** Whether this message is currently streaming. */
  isStreaming?: boolean
  /** Cursor character shown while streaming. */
  streamingCursor?: string
  /** Override the default background color. */
  backgroundColor?: string
  /** Compose sub-components: Message.Content, Message.Text, etc. */
  children: ReactNode
}

/** Chat message bubble with role-based styling. Compose with Message.Content, Message.Text, etc. */
export function Message({
  role,
  isStreaming = false,
  streamingCursor = "\u258E",
  backgroundColor,
  children,
}: MessageProps) {
  const theme = useTheme()
  const { assistantBg, userBg } = getBubbleColors(theme)
  const isUser = role === "user"
  const bg = backgroundColor ?? (isUser ? userBg : assistantBg)

  return (
    <MessageContext.Provider value={{ role, isStreaming, streamingCursor, backgroundColor: bg, textColor: theme.foreground }}>
      <box
        flexDirection="column"
        flexShrink={0}
        width="100%"
        alignItems={isUser ? "flex-end" : "flex-start"}
      >
        {children}
      </box>
    </MessageContext.Provider>
  )
}

// ── Attach sub-components ───────────────────────────────────────────

Message.Content = MessageContent
Message.Text = MessageText
Message.Reasoning = MessageReasoning
Message.ToolCall = MessageToolCall
Message.Source = MessageSource
Message.Footer = MessageFooter
