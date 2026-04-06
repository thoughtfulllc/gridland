// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import {
  MessageText,
  ChainOfThought,
  ChainOfThoughtHeader,
} from "@gridland/ui"
import type { ChatStatus } from "@gridland/ui"
import type { ReactNode } from "react"
import type { UIMessagePart } from "ai"

/** Convert Vercel AI SDK status string to ChatStatus union. */
export function toChatStatus(status: string): ChatStatus {
  return status === "streaming" || status === "submitted" || status === "error"
    ? status as ChatStatus
    : "ready"
}

/**
 * Maps Vercel AI SDK UIMessage.parts to Message sub-components.
 * Returns flat array of content elements (text parts only).
 * Tool calls and sources are not handled here — build custom components
 * using useMessage() for context if needed.
 */
export function renderContentParts(parts: UIMessagePart[], isStreaming: boolean): ReactNode[] {
  const elements: ReactNode[] = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const isLast = i === parts.length - 1

    if (part.type === "text") {
      elements.push(
        <MessageText key={`p-${i}`} isLast={isLast && isStreaming}>
          {part.text}
        </MessageText>
      )
    }
  }

  return elements
}

/**
 * Maps parts with reasoning separated from content.
 * Returns { reasoning: ReactNode[], content: ReactNode[] }.
 */
export function renderPartsWithReasoning(
  parts: UIMessagePart[],
  isStreaming: boolean,
  options?: { expanded?: boolean },
): { reasoning: ReactNode[]; content: ReactNode[] } {
  const reasoning: ReactNode[] = []
  const content: ReactNode[] = []
  let hasReasoning = false

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const isLast = i === parts.length - 1

    switch (part.type) {
      case "text":
        content.push(
          <MessageText key={`p-${i}`} isLast={isLast && isStreaming}>
            {part.text}
          </MessageText>
        )
        break
      case "reasoning":
        // Consolidate multiple reasoning parts into a single ChainOfThought
        if (!hasReasoning) {
          hasReasoning = true
          reasoning.push(
            <ChainOfThought
              key="reasoning"
              defaultOpen={options?.expanded !== false}
            >
              <ChainOfThoughtHeader />
            </ChainOfThought>
          )
        }
        break
    }
  }

  return { reasoning, content }
}
