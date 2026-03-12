// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { Message } from "@gridland/ui"
import type { ReactNode } from "react"
import type { UIMessagePart } from "@ai-sdk/react"

/**
 * Maps Vercel AI SDK UIMessage.parts to Message sub-components.
 * Returns flat array of content elements (text, tool invocations, sources).
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
          <Message.ToolInvocation key={`p-${i}`} part={{
            type: "tool-invocation",
            toolInvocation: {
              toolCallId: part.toolInvocation.toolCallId,
              toolName: part.toolInvocation.toolName,
              args: part.toolInvocation.args,
              state: part.toolInvocation.state,
              result: part.toolInvocation.result,
            },
          }} />
        )
        break
      case "source-url": {
        const idx = sourceIndex++
        elements.push(
          <Message.Source key={`p-${i}`} part={{
            type: "source",
            source: { title: part.title, url: part.url },
          }} index={idx} />
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
          <Message.Reasoning key={`r-${i}`} part={{
            type: "reasoning",
            reasoning: part.reasoning,
            collapsed: options?.expanded === false ? true : !(options?.expanded ?? true),
          }} />
        )
        break
      case "tool-invocation":
        content.push(
          <Message.ToolInvocation key={`p-${i}`} part={{
            type: "tool-invocation",
            toolInvocation: {
              toolCallId: part.toolInvocation.toolCallId,
              toolName: part.toolInvocation.toolName,
              args: part.toolInvocation.args,
              state: part.toolInvocation.state,
              result: part.toolInvocation.result,
            },
          }} />
        )
        break
      case "source-url": {
        const idx = sourceIndex++
        content.push(
          <Message.Source key={`p-${i}`} part={{
            type: "source",
            source: { title: part.title, url: part.url },
          }} index={idx} />
        )
        break
      }
    }
  }

  return { reasoning, content }
}
