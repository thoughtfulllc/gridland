import { useState, useEffect, useRef } from "react"
import { textStyle } from "../text-style"
import { useTheme } from "../theme/index"
import { Message } from "../message/message"
import { PromptInput } from "../prompt-input/prompt-input"
import type { ChatStatus } from "../prompt-input/prompt-input"
import { StatusBar } from "../status-bar/status-bar"
import type { Step } from "../timeline/timeline"
import { useKeyboardContext } from "../provider/provider"

// ── Default constants ────────────────────────────────────────────────

const DEFAULT_MODELS: AIChatModel[] = [
  { id: "claude-sonnet-4-20250514", label: "sonnet" },
  { id: "claude-haiku-4-5-20251001", label: "haiku" },
  { id: "claude-opus-4-20250514", label: "opus" },
]

const DEFAULT_COMMANDS: { cmd: string; desc?: string }[] = [
  { cmd: "/help", desc: "Show commands" },
  { cmd: "/clear", desc: "Clear conversation" },
  { cmd: "/model", desc: "Switch model" },
]

// ── Types ─────────────────────────────────────────────────────────────

export interface AIChatModel {
  id: string
  label: string
}

export interface AIChatStep {
  tool: string
  label: string
  duration: string
  status: "done" | "running" | "pending"
  detail?: string
}

export interface AIChatMessage {
  role: "user" | "assistant"
  text: string
  steps?: AIChatStep[]
}

export interface AIChatProps {
  /** API endpoint for chat SSE streaming. */
  apiUrl?: string
  /** useKeyboard hook from @opentui/react. */
  useKeyboard?: (handler: (event: any) => void) => void
  /** Initial messages to display. */
  initialMessages?: AIChatMessage[]
  /** Initial model label. Defaults to first model in the list. */
  initialModel?: string
  /** Available models for switching. Defaults to Claude sonnet/haiku/opus. */
  models?: AIChatModel[]
  /** Slash commands for autocomplete. Defaults to /help, /clear, /model. */
  commands?: { cmd: string; desc?: string }[]
  /** Placeholder text for the input. */
  placeholder?: string
}

// ── Helpers ───────────────────────────────────────────────────────────

function toTimelineSteps(steps: AIChatStep[]): Step[] {
  return steps.map(s => ({
    tool: s.tool,
    label: s.label,
    duration: s.duration,
    status: s.status,
    output: s.detail,
  }))
}

function stepsDuration(steps: AIChatStep[]): string {
  const d = steps.reduce((s, st) => s + (parseFloat(st.duration) || 0), 0)
  return d < 1 ? `${(d * 1000).toFixed(0)}ms` : `${d.toFixed(1)}s`
}

// ── Main component ────────────────────────────────────────────────────

export function AIChat({
  apiUrl = "/api/chat",
  useKeyboard: useKeyboardProp,
  initialMessages = [],
  initialModel,
  models = DEFAULT_MODELS,
  commands = DEFAULT_COMMANDS,
  placeholder = "Message Claude...",
}: AIChatProps) {
  const theme = useTheme()
  const useKeyboard = useKeyboardContext(useKeyboardProp)
  const mounted = useRef(true)

  const [messages, setMessages] = useState<AIChatMessage[]>(initialMessages)
  const [expanded, setExpanded] = useState(false)
  const [model, setModel] = useState(models.find(m => m.label === initialModel) ?? models[0]!)

  // Streaming state
  const [activeSteps, setActiveSteps] = useState<AIChatStep[]>([])
  const [completedSteps, setCompletedSteps] = useState<AIChatStep[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState("")
  const [error, setError] = useState("")
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useKeyboard?.((event: any) => {
    if (event.name === "E" && event.ctrl && event.shift) setExpanded(v => !v)
  })

  const chatStatus: ChatStatus =
    streaming ? "streaming"
    : activeSteps.length > 0 ? "submitted"
    : error ? "error"
    : "ready"

  // ── SSE streaming ───────────────────────────────────────────────────

  async function send(allMessages: AIChatMessage[]) {
    setError("")
    setActiveSteps([{ tool: "Think", label: "Processing...", duration: "", status: "running" }])
    try {
      const abort = new AbortController()
      abortRef.current = abort
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: model.id, messages: allMessages.map(m => ({ role: m.role, content: m.text })) }),
        signal: abort.signal,
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = "", revealed = 0, buffer = "", apiDone = false, textStarted = false
      const allSteps: AIChatStep[] = []
      const startTime = Date.now()
      let typewriter: ReturnType<typeof setInterval> | null = null

      function startTypewriter() {
        if (typewriter) return
        typewriter = setInterval(() => {
          if (!mounted.current) { clearInterval(typewriter!); return }
          const target = Math.min(revealed + 3, fullText.length)
          if (target > revealed) { revealed = target; setStreamText(fullText.slice(0, revealed)) }
          if (apiDone && revealed >= fullText.length) {
            clearInterval(typewriter!); typewriter = null
            setStreaming(false); setStreamText(""); setCompletedSteps([])
            setMessages(prev => [...prev, { role: "assistant", text: fullText, steps: allSteps.length ? [...allSteps] : undefined }])
          }
        }, 16)
      }

      while (true) {
        const { done, value: chunk } = await reader.read()
        if (done) break
        buffer += decoder.decode(chunk, { stream: true })
        const lines = buffer.split("\n"); buffer = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const ev = JSON.parse(line.slice(6))
          if (ev.type === "step_start") {
            setActiveSteps(prev => [...prev.map(s => ({ ...s, status: "done" as const })), { tool: ev.tool, label: ev.label, duration: "", status: "running" as const, detail: ev.detail }])
          } else if (ev.type === "step_done") {
            allSteps.push({ tool: ev.tool, label: ev.label, duration: ev.duration, status: "done", detail: ev.detail })
            setActiveSteps(prev => prev.map(s => s.tool === ev.tool && s.label === ev.label ? { ...s, status: "done" as const, duration: ev.duration, detail: ev.detail } : s))
          } else if (ev.type === "text") {
            if (!textStarted) {
              textStarted = true
              if (!allSteps.length) allSteps.push({ tool: "Think", label: "Processing", duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`, status: "done" })
              setCompletedSteps([...allSteps]); setActiveSteps([])
              setStreaming(true); setStreamText(""); startTypewriter()
            }
            fullText += ev.text
          } else if (ev.type === "error") {
            if (typewriter) clearInterval(typewriter)
            throw new Error(ev.error)
          }
        }
      }
      if (!textStarted) { setActiveSteps([]); setStreaming(false); return }
      apiDone = true
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Unknown error")
      setActiveSteps([]); setStreaming(false); setStreamText(""); setCompletedSteps([])
    } finally { abortRef.current = null }
  }

  // ── Submit handler ──────────────────────────────────────────────────

  function handleSubmit(msg: { text: string }) {
    const trimmed = msg.text.trim()
    if (!trimmed) return
    if (trimmed === "/clear") { setMessages([]); setError(""); return }
    if (trimmed.startsWith("/model")) {
      const arg = trimmed.slice(6).trim().toLowerCase()
      if (!arg) { const idx = models.indexOf(model); setModel(models[(idx + 1) % models.length]!) }
      else { const m = models.find(m => m.label === arg || m.id === arg); if (m) setModel(m) }
      return
    }
    const next = [...messages, { role: "user" as const, text: trimmed }]
    setMessages(next)
    send(next)
  }

  function handleStop() {
    abortRef.current?.abort()
    setActiveSteps([]); setStreaming(false); setStreamText(""); setCompletedSteps([])
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <box flexDirection="column" flexGrow={1}>
      {/* Messages */}
      <box flexDirection="column" paddingX={1} gap={1} flexGrow={1} overflow="hidden" justifyContent="flex-end">
        {messages.map((msg, i) => (
          <Message key={i} role={msg.role}>
            {msg.role === "assistant" && msg.steps?.length ? (
              <Message.Reasoning part={{
                type: "reasoning",
                duration: stepsDuration(msg.steps),
                collapsed: !expanded,
                steps: toTimelineSteps(msg.steps),
              }} />
            ) : null}
            <Message.Content>
              <Message.Text>{msg.text}</Message.Text>
            </Message.Content>
          </Message>
        ))}

        {/* Active steps (during tool use, before text arrives) */}
        {activeSteps.length > 0 && (
          <Message role="assistant">
            <Message.Reasoning part={{
              type: "reasoning",
              collapsed: !expanded,
              steps: toTimelineSteps(activeSteps),
            }} />
          </Message>
        )}

        {/* Streaming message (text arriving with completed steps) */}
        {streaming && (
          <Message role="assistant" isStreaming>
            {completedSteps.length > 0 && (
              <Message.Reasoning part={{
                type: "reasoning",
                duration: stepsDuration(completedSteps),
                collapsed: !expanded,
                steps: toTimelineSteps(completedSteps),
              }} />
            )}
            {streamText && (
              <Message.Content>
                <Message.Text isLast>{streamText}</Message.Text>
              </Message.Content>
            )}
          </Message>
        )}

        {error && <text><span style={textStyle({ fg: theme.error })}>{"Error: " + error}</span></text>}
      </box>

      {/* Input */}
      <box flexShrink={0}>
        <PromptInput
          commands={commands}
          onSubmit={handleSubmit}
          onStop={handleStop}
          status={chatStatus}
          placeholder={placeholder}
          useKeyboard={useKeyboard}
          showDividers
        />
      </box>

      {/* Status bar */}
      <StatusBar items={[
        { key: model.label, label: "model" },
        { key: "ctrl+shift+e", label: "toggle steps" },
        { key: "/", label: "commands" },
      ]} />
    </box>
  )
}
