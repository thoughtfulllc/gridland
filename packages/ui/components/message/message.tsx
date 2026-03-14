import { createContext, useContext } from "react"
import type { ReactNode } from "react"
import { textStyle } from "../text-style"
import { useTheme } from "../theme/index"
import type { Theme } from "../theme/index"
import { Timeline, type Step } from "../timeline/timeline"
export type { Step } from "../timeline/timeline"

// ── Part types (aligned with Vercel AI SDK UIMessage.parts) ─────────

export type TextPart = {
  type: "text"
  text: string
}

export type ReasoningPart = {
  type: "reasoning"
  reasoning?: string
  duration?: string
  steps?: Step[]
  collapsed?: boolean
}

export type ToolInvocationPart = {
  type: "tool-invocation"
  toolInvocation: {
    toolCallId: string
    toolName: string
    args?: unknown
    state: "partial-call" | "call" | "result"
    result?: unknown
  }
}

export type SourcePart = {
  type: "source"
  source: {
    title?: string
    url?: string
  }
}

export type MessagePart = TextPart | ReasoningPart | ToolInvocationPart | SourcePart

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

function getBubbleColors(theme: Theme): { assistantBg: string; userBg: string } {
  const isDark = theme.background !== "#FFFFFF"
  return isDark
    ? { assistantBg: "#2a2a4a", userBg: "#2a3a3a" }
    : { assistantBg: "#F1F5F9", userBg: "#E2E8F0" }
}

const TOOL_STATE_ICONS: Record<string, string> = {
  "partial-call": "\u2022",  // •
  "call": "\u280B",          // ⠋
  "result": "\u2713",        // ✓
}

function getToolStateColor(state: string, theme: Theme): string {
  switch (state) {
    case "partial-call": return theme.muted
    case "call": return theme.warning
    case "result": return theme.success
    default: return theme.muted
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

/** Renders a reasoning part as a collapsible Timeline. */
function MessageReasoning({ part }: { part: ReasoningPart }) {
  return (
    <Timeline
      steps={part.steps}
      duration={part.duration}
      collapsed={part.collapsed}
    />
  )
}

/** Renders a tool invocation with status icon and optional result. */
function MessageToolInvocation({ part, toolColors }: {
  part: ToolInvocationPart
  toolColors?: Record<string, string>
}) {
  const theme = useTheme()
  const { backgroundColor, textColor } = useMessage()
  const { toolName, state, result } = part.toolInvocation
  const icon = TOOL_STATE_ICONS[state] || "\u2022"
  const stateColor = toolColors?.[toolName] ?? getToolStateColor(state, theme)
  const isActive = state === "partial-call" || state === "call"

  return (
    <box flexDirection="column">
      <text>
        <span style={textStyle({ fg: stateColor, bg: backgroundColor })}>{icon}</span>
        <span style={textStyle({ fg: textColor, bg: backgroundColor })}>{" "}</span>
        <span style={textStyle({ fg: stateColor, bold: isActive, bg: backgroundColor })}>{toolName}</span>
        {isActive && <span style={textStyle({ fg: textColor, dim: true, bg: backgroundColor })}>{" ..."}</span>}
      </text>
      {state === "result" && result !== undefined && (
        <text>
          <span style={textStyle({ fg: textColor, dim: true, bg: backgroundColor })}>{"  \u2514\u2500 "}</span>
          <span style={textStyle({ fg: textColor, dim: true, bg: backgroundColor })}>{String(result).slice(0, 120)}</span>
        </text>
      )}
    </box>
  )
}

/** Renders a numbered source citation. */
function MessageSource({ part, index }: {
  part: SourcePart
  index: number
}) {
  const theme = useTheme()
  const { backgroundColor, textColor } = useMessage()
  const title = part.source.title || part.source.url || "source"

  return (
    <text>
      <span style={textStyle({ fg: textColor, dim: true, bg: backgroundColor })}>{"["}</span>
      <span style={textStyle({ fg: theme.accent, bg: backgroundColor })}>{String(index + 1)}</span>
      <span style={textStyle({ fg: textColor, dim: true, bg: backgroundColor })}>{"] "}</span>
      <span style={textStyle({ fg: theme.accent, bg: backgroundColor })}>{title}</span>
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
Message.ToolInvocation = MessageToolInvocation
Message.Source = MessageSource
Message.Footer = MessageFooter
