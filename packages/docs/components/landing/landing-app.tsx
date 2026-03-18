// @ts-nocheck
import { Message, Modal, PromptInput, PromptInputProvider, StatusBar, textStyle, useBreakpoints, useTheme } from '@gridland/ui'
import { useCallback, useState } from 'react'
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

  // Ready for future click-to-open — just call openChatDemo()
  const openChatDemo = useCallback(() => setShowChatModal(true), [])
  const closeChatDemo = useCallback(() => setShowChatModal(false), [])

  // Approximate the bordered box position for matrix background clear rect
  const isBrowser = typeof document !== 'undefined'
  const logoHeight = isTiny ? 2 : isNarrow ? 13 : 7
  const logoExtra = isBrowser ? 1 : 0
  const gap = isMobile ? 0 : 1
  const installLinksTop = 3 + logoHeight + logoExtra + gap
  const installLinksHeight = 3
  const boxTop = installLinksTop + installLinksHeight + gap + 1
  const boxHeight = height - boxTop - 1
  const clearRect = { top: boxTop, left: 1, width: width - 2, height: boxHeight }
  const installLinksClearRect = { top: installLinksTop, left: 1, width: width - 2, height: installLinksHeight }

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
      <MatrixBackground width={width} height={height} clearRect={chatTooSmall ? undefined : clearRect} clearRects={[installLinksClearRect]} />
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
            <box flexGrow={1} justifyContent="center" alignItems="center">
              <text>
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
          const isLiveStreaming = !demo.streamingMsgId && demo.chatStatus === 'streaming' && msg.role === 'assistant' && msg === demo.messages[demo.messages.length - 1]
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
