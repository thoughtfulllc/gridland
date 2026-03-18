// @ts-nocheck
import { Message, Modal, PromptInput, PromptInputProvider, StatusBar, textStyle, useBreakpoints, useTheme } from '@gridland/ui'
import { useCallback, useMemo, useState } from 'react'
import { InstallBox } from './install-box'
import { LinksBox } from './links-box'
import { Logo } from './logo'
import { MatrixBackground } from './matrix-background'
import { useDemoChat } from './use-demo-chat'

// Minimum rows needed to fit 2 chat bubbles + prompt input + border
const MIN_CHAT_HEIGHT = 13

interface LandingAppProps {
  useKeyboard: any
}

export function LandingApp({ useKeyboard }: LandingAppProps) {
  const theme = useTheme()
  const { width, height, isNarrow, isTiny, isMobile } = useBreakpoints()
  const [showChatModal, setShowChatModal] = useState(false)

  const openChatDemo = useCallback(() => setShowChatModal(true), [])
  const closeChatDemo = useCallback(() => setShowChatModal(false), [])

  // Compute clearRects for matrix background: prevent matrix behind bordered boxes and chat area.
  // On CLI, transparent fills don't overwrite existing characters (Zig alpha-blending preserves them),
  // so the matrix would bleed through bordered boxes without these rects. On web, transparent fills
  // do clear characters, so clearRects are redundant but harmless — no platform branching needed.
  const { clearRects, boxHeight } = useMemo(() => {
    const logoHeight = isTiny ? 4 : isNarrow ? 15 : 9
    const gap = isMobile ? 0 : 1
    const boxRowTop = 3 + logoHeight + gap
    const boxRowHeight = 3 // bordered box: 1 content + 2 border
    const chatTop = boxRowTop + boxRowHeight + gap
    const bh = height - chatTop - 1

    // Per-box clearRects: sized to each box, not full width, so matrix shows in gaps
    const box1W = 33 // "$ bunx @gridland/demo landing" + paddingX + border
    const box2W = 25 // "$ bun create gridland" + paddingX + border
    const box3W = 22 // "🐱 GitHub  📖 Docs" + paddingX + border
    const totalRowW = box1W + box2W + box3W + 2 * gap
    const availW = width - 2
    const rects: { top: number; left: number; width: number; height: number }[] = []

    if (totalRowW <= availW) {
      // All 3 fit on one row — clear interior only (border chars overwrite matrix on both platforms)
      const startLeft = 1 + Math.floor((availW - totalRowW) / 2)
      const interiorTop = boxRowTop + 1
      const interiorH = boxRowHeight - 2
      rects.push({ top: interiorTop, left: startLeft + 1, width: box1W - 2, height: interiorH })
      rects.push({ top: interiorTop, left: startLeft + box1W + gap + 1, width: box2W - 2, height: interiorH })
      rects.push({ top: interiorTop, left: startLeft + box1W + gap + box2W + gap + 1, width: box3W - 2, height: interiorH })
    } else {
      // Boxes wrap — clear the full row area (approximate wrapping height)
      const wrappedHeight = boxRowHeight * 2 + gap
      rects.push({ top: boxRowTop, left: 1, width: availW, height: wrappedHeight })
    }

    // Chat area clearRect
    if (bh >= MIN_CHAT_HEIGHT) {
      rects.push({ top: chatTop, left: 1, width: availW, height: bh })
    }

    return { clearRects: rects, boxHeight: bh }
  }, [width, height, isTiny, isNarrow, isMobile])

  const chatTooSmall = boxHeight < MIN_CHAT_HEIGHT

  useKeyboard((event: any) => {
    if (event.name === 'o' && !showChatModal && chatTooSmall) {
      openChatDemo()
    }
    if (event.name === 'q' && showChatModal) {
      closeChatDemo()
    }
  })

  if (showChatModal) {
    return (
      <box flexDirection="column" width="100%" height="100%" paddingLeft={2}>
        <Modal title="Chat Demo" onClose={closeChatDemo} useKeyboard={useKeyboard}>
          <PromptInputProvider>
            <ChatArea useKeyboard={useKeyboard} />
          </PromptInputProvider>
        </Modal>
        <StatusBar items={[{ key: 'q', label: 'close demo' }]} />
      </box>
    )
  }

  return (
    <box width="100%" height="100%" position="relative">
      <MatrixBackground width={width} height={height} clearRects={clearRects} />
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
          {chatTooSmall ? (
            <box flexGrow={1} justifyContent="center" alignItems="center" shouldFill={false}>
              <text shouldFill={false}>
                <span style={textStyle({ fg: theme.muted })}>Press </span>
                <span style={textStyle({ bold: true, fg: theme.accent })}>o</span>
                <span style={textStyle({ fg: theme.muted })}> to open chat demo</span>
              </text>
            </box>
          ) : (
            <box flexGrow={1} border borderStyle="rounded" borderColor={theme.border} flexDirection="column" overflow="hidden">
              <PromptInputProvider>
                <ChatArea useKeyboard={useKeyboard} />
              </PromptInputProvider>
            </box>
          )}
        </box>
      </box>
    </box>
  )
}

function ChatArea({ useKeyboard }: { useKeyboard: any }) {
  const theme = useTheme()
  const demo = useDemoChat()

  return (
    <box flexGrow={1} flexDirection="column" overflow="hidden">
      <box flexGrow={1} flexDirection="column" paddingX={1} overflow="hidden" justifyContent="flex-end" gap={1}>
        {demo.messages.map((msg) => {
          const isDemoStreaming = msg.id === demo.streamingMsgId
          const isLiveStreaming = !demo.streamingMsgId && demo.chatStatus === 'streaming' && msg.role === 'assistant' && msg.id === demo.messages[demo.messages.length - 1]?.id
          const msgStreaming = isDemoStreaming || isLiveStreaming
          const displayText = isDemoStreaming ? demo.streamingText : msg.content

          return (
            <Message key={msg.id} role={msg.role} isStreaming={msgStreaming}>
              <Message.Content>
                <Message.Text isLast={msgStreaming}>{displayText}</Message.Text>
              </Message.Content>
            </Message>
          )
        })}
        {demo.isYourTurn && (
          <text>
            <span style={textStyle({ dim: true, fg: theme.muted })}>Your turn — type something and press Enter...</span>
          </text>
        )}
      </box>
      <PromptInput autoFocus placeholder="Ask about Gridland..." status={demo.chatStatus} onSubmit={demo.handleSubmit} onChange={demo.handleChange} onStop={demo.handleStop} useKeyboard={useKeyboard} />
    </box>
  )
}
