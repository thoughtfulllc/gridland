// @ts-nocheck
import { useState, useEffect, useRef } from "react"
import { useKeyboard } from "@gridland/utils"
import { Message, StatusBar } from "@gridland/ui"

const RESPONSE = "I've refactored the auth module. The changes include extracting the token validation into a shared helper, consolidating the middleware chain, and updating the test suite to match."

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

  useEffect(() => {
    if (phase === "done") {
      timerRef.current = setTimeout(() => restart(), 3000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase])

  const isStreaming = phase === "streaming"
  const isDone = phase === "done"
  const showAssistant = phase !== "idle"

  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="column" padding={1} gap={1} flexGrow={1}>
        <Message role="user">
          <Message.Content>
            <Message.Text>Can you refactor the auth module?</Message.Text>
          </Message.Content>
        </Message>
        {showAssistant && (
          <Message role="assistant" isStreaming={isStreaming}>
            <Message.Content>
              <Message.Text isLast>{isDone ? RESPONSE : streamedText}</Message.Text>
            </Message.Content>
          </Message>
        )}
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "r", label: "restart" }]} />
      </box>
    </box>
  )
}
