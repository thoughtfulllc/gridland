// @ts-nocheck
import { createContext, memo, useContext, useMemo } from "react"
import type { ReactNode } from "react"
import { textStyle } from "../text-style"
import { useTheme } from "../theme/index"

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

// ── Sub-components ──────────────────────────────────────────────────

export interface MessageContentProps {
  /** Sub-components to render inside the message bubble. */
  children: ReactNode
}

/** Bubble wrapper with background color. Reads bg from Message context. */
export const MessageContent = memo(function MessageContent({ children }: MessageContentProps) {
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
})

export interface MessageTextProps {
  /** Text content to display. */
  children: string
  /** When true and the parent Message is streaming, shows the streaming cursor after this text. */
  isLast?: boolean
}

/** Renders text with word wrap. Pass `isLast` to show the streaming cursor. */
export const MessageText = memo(function MessageText({ children, isLast = false }: MessageTextProps) {
  const { isStreaming, streamingCursor, backgroundColor, textColor } = useMessage()

  return (
    <text wrapMode="word">
      <span style={textStyle({ fg: textColor, bg: backgroundColor })}>{children}</span>
      {isLast && isStreaming && (
        <span style={textStyle({ fg: textColor, dim: true, bg: backgroundColor })}>{streamingCursor}</span>
      )}
    </text>
  )
})

export interface MessageMarkdownProps {
  /** Markdown string to render. */
  children: string
  /** When true and the parent Message is streaming, shows the streaming cursor after this content. */
  isLast?: boolean
}

/** Renders markdown content via the OpenTUI markdown intrinsic. */
export const MessageMarkdown = memo(function MessageMarkdown({ children, isLast = false }: MessageMarkdownProps) {
  const { isStreaming, streamingCursor, backgroundColor, textColor } = useMessage()

  return (
    <box flexDirection="column">
      <markdown content={children} bg={backgroundColor} />
      {isLast && isStreaming && (
        <text>
          <span style={textStyle({ fg: textColor, dim: true, bg: backgroundColor })}>{streamingCursor}</span>
        </text>
      )}
    </box>
  )
})

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
  /** Compose sub-components: MessageContent, MessageText, etc. */
  children: ReactNode
}

/** Chat message bubble with role-based styling. Compose with MessageContent, MessageText, etc. */
export function Message({
  role,
  isStreaming = false,
  streamingCursor = "\u258E",
  backgroundColor,
  children,
}: MessageProps) {
  const theme = useTheme()
  const isUser = role === "user"
  const bg = backgroundColor ?? (isUser ? theme.messageUser : theme.messageAssistant)
  const contextValue = useMemo<MessageContextValue>(
    () => ({ role, isStreaming, streamingCursor, backgroundColor: bg, textColor: theme.foreground }),
    [role, isStreaming, streamingCursor, bg, theme.foreground],
  )

  return (
    <MessageContext.Provider value={contextValue}>
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

// ── Display names for React DevTools ────────────────────────────────

Message.displayName = "Message"
MessageContent.displayName = "MessageContent"
MessageText.displayName = "MessageText"
MessageMarkdown.displayName = "MessageMarkdown"
