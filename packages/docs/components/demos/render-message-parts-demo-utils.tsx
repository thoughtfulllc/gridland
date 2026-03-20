// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { Message } from "@gridland/ui"
import type { ReactNode } from "react"
import type { UIMessagePart } from "@ai-sdk/react"

/**
 * Maps Vercel AI SDK UIMessage.parts to Message sub-components.
 * Returns flat array of content elements (text, tool calls, sources).
 */
export function renderContentParts(parts: UIMessagePart[], isStreaming: boolean): ReactNode[] {
  const elements: ReactNode[] = []
  let sourceIndex = 0

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const isLast = i === parts.length - 1

    switch (part.type) {
      case "text":
        elements.push(
          <Message.Text key={`p-${i}`} isLast={isLast && isStreaming}>
            {part.text}
          </Message.Text>
        )
        break
      case "tool-invocation":
        elements.push(
          <Message.ToolCall
            key={`p-${i}`}
            name={part.toolInvocation.toolName}
            state={mapToolState(part.toolInvocation.state)}
            result={part.toolInvocation.result}
          />
        )
        break
      case "source-url": {
        const idx = sourceIndex++
        elements.push(
          <Message.Source key={`p-${i}`} title={part.title} url={part.url} index={idx} />
        )
        break
      }
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
  let sourceIndex = 0

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const isLast = i === parts.length - 1

    switch (part.type) {
      case "text":
        content.push(
          <Message.Text key={`p-${i}`} isLast={isLast && isStreaming}>
            {part.text}
          </Message.Text>
        )
        break
      case "reasoning":
        reasoning.push(
          <Message.Reasoning
            key={`r-${i}`}
            collapsed={options?.expanded === false ? true : !(options?.expanded ?? true)}
          />
        )
        break
      case "tool-invocation":
        content.push(
          <Message.ToolCall
            key={`p-${i}`}
            name={part.toolInvocation.toolName}
            state={mapToolState(part.toolInvocation.state)}
            result={part.toolInvocation.result}
          />
        )
        break
      case "source-url": {
        const idx = sourceIndex++
        content.push(
          <Message.Source key={`p-${i}`} title={part.title} url={part.url} index={idx} />
        )
        break
      }
    }
  }

  return { reasoning, content }
}

/** Maps Vercel AI SDK tool states to our generic ToolCallState. */
function mapToolState(state: string): "pending" | "running" | "completed" | "error" {
  switch (state) {
    case "partial-call": return "pending"
    case "call": return "running"
    case "result": return "completed"
    default: return "pending"
  }
}
