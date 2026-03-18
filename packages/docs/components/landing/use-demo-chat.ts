// @ts-nocheck
import { chatTransport } from '@/lib/chat'
import { useChat } from '@ai-sdk/react'
import type { ChatStatus } from '@gridland/ui'
import { usePromptInputController } from '@gridland/ui'
import { useCallback, useEffect, useRef, useState } from 'react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type DemoPhase = 'IDLE' | 'TYPING' | 'STREAMING' | 'PAUSE' | 'YOUR_TURN' | 'LIVE'

const DEMO_SCRIPT = [
  {
    prompt: 'What is Gridland?',
    response: 'Gridland is a framework for building terminal apps with React. It works in both the browser and real terminals!',
  },
  {
    prompt: 'What are the features?',
    response: 'Features\n\n• Canvas-rendered TUI components\n• React reconciler with JSX\n• Yoga flexbox layout engine\n• Keyboard, mouse, and clipboard support\n• Next.js and Vite plugins',
  },
  {
    prompt: "What's the tech stack?",
    response: 'React + opentui engine + yoga-layout + HTML5 Canvas',
  },
]

const INITIAL_DELAY = 800
const TYPING_SPEED = 60
const TYPING_PAUSE = 400
const STREAMING_SPEED = 25
const ROUND_PAUSE = 1500
const YOUR_TURN_DELAY = 800

export function useDemoChat() {
  const controller = usePromptInputController()
  const controllerRef = useRef(controller)
  controllerRef.current = controller

  const [phase, setPhase] = useState<DemoPhase>('IDLE')
  const [round, setRound] = useState(0)
  const [demoMessages, setDemoMessages] = useState<ChatMessage[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null)
  const [isYourTurn, setIsYourTurn] = useState(false)

  const phaseRef = useRef<DemoPhase>(phase)
  phaseRef.current = phase

  // Tracks whether the demo was aborted so intervals stop immediately
  // (without waiting for React effect cleanup on next render)
  const abortedRef = useRef(false)
  // Tracks what the demo typed into the input so handleChange can strip it
  const demoInputRef = useRef('')

  const {
    messages: liveMessages,
    status: liveStatus,
    sendMessage,
    stop,
  } = useChat({
    transport: chatTransport,
  })

  // ── Phase-driven effects ────────────────────────────────────────────────

  useEffect(() => {
    if (phase === 'IDLE') {
      const id = setTimeout(() => {
        setRound(0)
        setPhase('TYPING')
      }, INITIAL_DELAY)
      return () => clearTimeout(id)
    }

    if (phase === 'TYPING') {
      abortedRef.current = false
      demoInputRef.current = ''
      const script = DEMO_SCRIPT[round]!
      let charIdx = 0
      let pauseTimer: ReturnType<typeof setTimeout> | null = null

      const interval = setInterval(() => {
        if (abortedRef.current) return
        charIdx++
        if (charIdx <= script.prompt.length) {
          const partial = script.prompt.slice(0, charIdx)
          controllerRef.current.textInput.setValue(partial)
          demoInputRef.current = partial
        } else {
          clearInterval(interval)
          pauseTimer = setTimeout(() => {
            if (abortedRef.current) return
            controllerRef.current.textInput.clear()
            demoInputRef.current = ''
            setDemoMessages((prev) => [...prev, { id: `demo-u-${round}`, role: 'user', content: script.prompt }])
            setPhase('STREAMING')
          }, TYPING_PAUSE)
        }
      }, TYPING_SPEED)

      return () => {
        clearInterval(interval)
        if (pauseTimer) clearTimeout(pauseTimer)
        demoInputRef.current = ''
      }
    }

    if (phase === 'STREAMING') {
      abortedRef.current = false
      const script = DEMO_SCRIPT[round]!
      const msgId = `demo-a-${round}`
      let charIdx = 0

      setDemoMessages((prev) => [...prev, { id: msgId, role: 'assistant', content: '' }])
      setStreamingMsgId(msgId)
      setStreamingText('')

      let doneTimer: ReturnType<typeof setTimeout> | null = null

      const interval = setInterval(() => {
        if (abortedRef.current) return
        charIdx++
        if (charIdx <= script.response.length) {
          setStreamingText(script.response.slice(0, charIdx))
        } else {
          clearInterval(interval)
          setDemoMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, content: script.response } : m)))
          setStreamingText('')
          setStreamingMsgId(null)

          const isLastRound = round >= DEMO_SCRIPT.length - 1
          if (isLastRound) {
            doneTimer = setTimeout(() => {
              setIsYourTurn(true)
              setPhase('YOUR_TURN')
            }, YOUR_TURN_DELAY)
          } else {
            doneTimer = setTimeout(() => setPhase('PAUSE'), 0)
          }
        }
      }, STREAMING_SPEED)

      return () => {
        clearInterval(interval)
        if (doneTimer) clearTimeout(doneTimer)
      }
    }

    if (phase === 'PAUSE') {
      const id = setTimeout(() => {
        setRound((r) => r + 1)
        setPhase('TYPING')
      }, ROUND_PAUSE)
      return () => clearTimeout(id)
    }
  }, [phase, round])

  // ── Abort helper ────────────────────────────────────────────────────────

  const abortDemo = useCallback(() => {
    controllerRef.current.textInput.clear()
    setPhase('LIVE')
    setStreamingText('')
    setStreamingMsgId(null)
    setIsYourTurn(false)
  }, [])

  // ── Handlers for PromptInput ────────────────────────────────────────────

  const handleChange = useCallback(
    (text: string) => {
      const p = phaseRef.current
      if (p !== 'LIVE') {
        abortedRef.current = true
        setPhase('LIVE')
        setStreamingText('')
        setStreamingMsgId(null)
        setIsYourTurn(false)

        // Strip any demo-typed prefix so only the user's character remains
        const demoText = demoInputRef.current
        demoInputRef.current = ''
        if (demoText && text.startsWith(demoText)) {
          controllerRef.current.textInput.setValue(text.slice(demoText.length))
        }
      }
    },
    [],
  )

  const handleSubmit = useCallback(
    ({ text }: { text: string }) => {
      if (phaseRef.current !== 'LIVE') {
        abortDemo()
      }
      sendMessage({ text })
      setPhase('LIVE')
    },
    [abortDemo, sendMessage],
  )

  const handleStop = useCallback(() => {
    stop()
  }, [stop])

  // ── Derived state ───────────────────────────────────────────────────────

  const chatStatus: ChatStatus = (() => {
    if (phase === 'STREAMING') return 'streaming'
    if (phase === 'LIVE') {
      if (liveStatus === 'streaming') return 'streaming'
      if (liveStatus === 'submitted') return 'submitted'
      if (liveStatus === 'error') return 'error'
      return 'ready'
    }
    return 'ready'
  })()

  const messages: ChatMessage[] = [
    ...demoMessages,
    ...liveMessages.map((m) => {
      let text = typeof m.content === 'string' ? m.content : ''
      if (!text && m.parts?.length) {
        text = m.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('')
      }
      return { id: m.id, role: m.role as 'user' | 'assistant', content: text }
    }),
  ]

  return {
    messages,
    chatStatus,
    streamingText,
    streamingMsgId,
    isYourTurn,
    handleSubmit,
    handleChange,
    handleStop,
  }
}
