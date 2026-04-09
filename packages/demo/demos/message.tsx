// @ts-nocheck
import { useState, useEffect, useRef } from "react"
import { useKeyboard } from "@gridland/utils"
import {
  Message,
  MessageContent,
  MessageText,
  MessageMarkdown,
  StatusBar,
} from "@gridland/ui"

const RESPONSE = "I've refactored the **auth module**. The changes include:\n\n- Extracting the token validation into a shared helper\n- Consolidating the middleware chain\n- Updating the test suite to match"

type Phase = "idle" | "streaming" | "done"

export function MessageApp() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [streamedText, setStreamedText] = useState("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useKeyboard((event) => {
    if (event.name === "r") restart()
  })

  function restart() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPhase("idle")
    setStreamedText("")
  }

  useEffect(() => {
    if (phase === "idle") {
      timerRef.current = setTimeout(() => setPhase("streaming"), 800)
    } else if (phase === "done") {
      timerRef.current = setTimeout(() => restart(), 3000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase])

  useEffect(() => {
    if (phase !== "streaming") return
    if (streamedText.length < RESPONSE.length) {
      timerRef.current = setTimeout(() => {
        setStreamedText(RESPONSE.slice(0, streamedText.length + 2))
      }, 25)
    } else {
      timerRef.current = setTimeout(() => setPhase("done"), 500)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase, streamedText])

  const showAssistant = phase !== "idle"
  const showText = phase === "streaming" || phase === "done"
  const isStreaming = phase === "streaming"
  const isDone = phase === "done"

  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="column" padding={1} gap={1} flexGrow={1}>
        <Message role="user">
          <MessageContent>
            <MessageText>Can you refactor the auth module?</MessageText>
          </MessageContent>
        </Message>
        {showAssistant && (
          <Message role="assistant" isStreaming={isStreaming}>
            <MessageContent>
              {showText && (
                <MessageMarkdown>{isDone ? RESPONSE : streamedText}</MessageMarkdown>
              )}
            </MessageContent>
          </Message>
        )}
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "r", label: "restart" }]} />
      </box>
    </box>
  )
}
