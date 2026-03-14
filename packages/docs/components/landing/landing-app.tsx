// @ts-nocheck
import type { ChatStatus } from '@gridland/ui'
import { Message, PromptInput, StatusBar, textStyle, useBreakpoints, useTheme } from '@gridland/ui'
import { useCallback, useRef, useState } from 'react'
import { AboutModal } from './about-modal'
import { InstallBox } from './install-box'
import { LinksBox } from './links-box'
import { Logo } from './logo'
import { MatrixBackground } from './matrix-background'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const DEMO_RESPONSES: string[] = [
  'Gridland is a framework for building terminal apps with React. It works in both the browser and terminal!',
  'You can get started with `bun create gridland` to scaffold a new project.',
  'OpenTUI provides the layout primitives — flexbox, borders, text styling — while React handles the component model.',
  'Yes! Gridland apps are universal — the same code renders in a terminal emulator and in the browser.',
  'Check out the docs for examples of interactive components like inputs, selects, and tables.',
]

interface LandingAppProps {
  useKeyboard: any
}

export function LandingApp({ useKeyboard }: LandingAppProps) {
  const theme = useTheme()
  const { width, height, isNarrow, isTiny, isMobile } = useBreakpoints()
  const [showAbout, setShowAbout] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatStatus, setChatStatus] = useState<ChatStatus>('ready')
  const responseIdx = useRef(0)

  const handleChatSubmit = useCallback(({ text }: { text: string }) => {
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setChatStatus('streaming')

    // Simulate AI response after a short delay
    setTimeout(() => {
      const response = DEMO_RESPONSES[responseIdx.current % DEMO_RESPONSES.length]!
      responseIdx.current += 1
      const assistantMsg: ChatMessage = { id: `a-${Date.now()}`, role: 'assistant', content: response }
      setMessages((prev) => [...prev, assistantMsg])
      setChatStatus('ready')
    }, 1200)
  }, [])

  useKeyboard((event: any) => {
    if (event.name === 'a' && !showAbout) {
      setShowAbout(true)
    }
    if (event.name === 'q' && showAbout) {
      setShowAbout(false)
    }
  })

  if (showAbout) {
    return (
      <box flexDirection="column" width="100%" height="100%">
        <box flexGrow={1}>
          <AboutModal onClose={() => setShowAbout(false)} useKeyboard={useKeyboard} />
        </box>
        <StatusBar items={[{ key: 'q', label: 'close' }]} />
      </box>
    )
  }

  // Approximate the bordered box position for matrix background clear rect:
  // paddingTop(3) + logo(~7 for full, ~13 for narrow, ~2 for tiny) + gap + install/links(3) + gap
  const isBrowser = typeof document !== 'undefined'
  const logoHeight = isTiny ? 2 : isNarrow ? 13 : 7
  // Browser logo has an extra spacer line before subtitle
  const logoExtra = isBrowser ? 1 : 0
  const gap = isMobile ? 0 : 1
  const installLinksTop = 3 + logoHeight + logoExtra + gap
  const installLinksHeight = 3
  const boxTop = installLinksTop + installLinksHeight + gap + 1
  // paddingLeft(1) to paddingRight(1), statusbar takes 1 row at bottom
  const boxHeight = height - boxTop - 1 - 1
  const clearRect = { top: boxTop, left: 1, width: width - 2, height: boxHeight }
  const installLinksClearRect = { top: installLinksTop, left: 1, width: width - 2, height: installLinksHeight }

  return (
    <box width="100%" height="100%" position="relative">
      <MatrixBackground width={width} height={height} clearRect={clearRect} clearRects={[installLinksClearRect]} />
      <box position="absolute" top={0} left={0} width={width} height={height} zIndex={1} flexDirection="column" shouldFill={false}>
        <box flexGrow={1} flexDirection="column" paddingTop={3} paddingLeft={1} paddingRight={1} paddingBottom={1} gap={isMobile ? 0 : 1} shouldFill={false}>
          <box flexShrink={0} shouldFill={false}>
            <Logo compact={isTiny} narrow={isNarrow} mobile={isMobile} />
          </box>
          <box flexDirection="row" flexWrap="wrap" justifyContent="center" gap={isMobile ? 0 : 1} flexShrink={0} shouldFill={false}>
            <box border borderStyle="rounded" borderColor={theme.border} paddingX={1} flexDirection="column" flexShrink={0}>
              <text>
                <span style={textStyle({ dim: true })}>$ </span>
                <span style={textStyle({ bold: true })}>bunx </span>
                <span style={textStyle({ fg: theme.accent })}>@gridland/demo landing</span>
              </text>
            </box>
            <InstallBox />
            <LinksBox />
          </box>
          <box flexGrow={1} border borderStyle="rounded" borderColor={theme.border} flexDirection="column" overflow="hidden">
            <box flexGrow={1} flexDirection="column" paddingX={1} overflow="hidden">
              {messages.map((msg) => (
                <Message key={msg.id} role={msg.role}>
                  <Message.Content>
                    <Message.Text>{msg.content}</Message.Text>
                  </Message.Content>
                </Message>
              ))}
            </box>
            <box flexShrink={0} paddingX={1} paddingBottom={0}>
              <PromptInput splaceholder="Ask about Gridland..." status={chatStatus} onSubmit={handleChatSubmit} useKeyboard={useKeyboard} />
            </box>
          </box>
        </box>
        <StatusBar items={[{ key: 'a', label: 'about' }]} />
      </box>
    </box>
  )
}
