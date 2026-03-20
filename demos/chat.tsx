// @ts-nocheck
import { useState, useCallback, useRef } from "react"
import { useKeyboard } from "@gridland/utils"
import { ChatPanel } from "@gridland/ui"
import type { ChatMessage, ToolCallInfo } from "@gridland/ui"

const initialMessages: ChatMessage[] = [
  { id: "1", role: "user", content: "Show me my portfolio" },
  { id: "2", role: "assistant", content: "Here's your current portfolio allocation:" },
  { id: "3", role: "user", content: "Calculate rebalancing trades" },
  { id: "4", role: "assistant", content: "I've calculated the optimal trades to rebalance your portfolio." },
]

let nextId = 5

export function ChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCallInfo[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleSend = useCallback((text: string) => {
    const userMsg: ChatMessage = { id: String(nextId++), role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    const toolCallId = `tc-${nextId}`

    setTimeout(() => {
      setIsLoading(false)
      setActiveToolCalls([{ id: toolCallId, title: "process_request", status: "in_progress" }])
    }, 500)

    setTimeout(() => {
      setActiveToolCalls([{ id: toolCallId, title: "process_request", status: "completed" }])
    }, 1200)

    const response = `You said: "${text}". This is a demo response.`
    let charIndex = 0
    setTimeout(() => {
      intervalRef.current = setInterval(() => {
        charIndex = Math.min(charIndex + 3, response.length)
        if (charIndex < response.length) {
          setStreamingText(response.slice(0, charIndex))
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setStreamingText("")
          setActiveToolCalls([])
          setMessages((prev) => [
            ...prev,
            { id: String(nextId++), role: "assistant", content: response },
          ])
        }
      }, 50)
    }, 1400)
  }, [])

  const handleCancel = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsLoading(false)
    setStreamingText("")
    setActiveToolCalls([])
  }, [])

  return (
    <ChatPanel
      messages={messages}
      streamingText={streamingText}
      isLoading={isLoading}
      activeToolCalls={activeToolCalls}
      onSendMessage={handleSend}
      onCancel={handleCancel}
      placeholder="Ask about your portfolio..."
      useKeyboard={useKeyboard}
    />
  )
}
