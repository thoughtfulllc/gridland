// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import {
  SideNav,
  Message,
  PromptInput,
  SelectInput,
  Modal,
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
  CommandProvider,
  useRegisterCommands,
  useFocusBorderStyle,
  useFocusDividerStyle,
} from "@gridland/ui"
import type { ChatStatus } from "@gridland/ui"
import { useFocus, useKeyboard, useCapturedKeyboard, useShortcuts } from "@gridland/utils"
import { useChat } from "@ai-sdk/react"
import { renderPartsWithReasoning, toChatStatus } from "./render-message-parts-demo-utils"
import {
  chatModels,
  loadSelectedModel,
  saveSelectedModel,
  getModelById,
} from "./ai-chat-models"

const COT_PREFIX = "cot-"
const STORAGE_KEY = "gridland-chat-history"
const MAX_CONVERSATIONS = 50

// -- Chat history persistence ------------------------------------------------

interface StoredConversation {
  id: string
  title: string
  createdAt: number
  messages: any[]
}

function loadHistory(): StoredConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(conversations: StoredConversation[]) {
  let items = conversations.slice(0, MAX_CONVERSATIONS)
  while (items.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      return
    } catch (e) {
      if (e instanceof DOMException && e.name === "QuotaExceededError" && items.length > 1) {
        items = items.slice(0, -1)
      } else {
        return
      }
    }
  }
}

function deriveTitle(messages: any[]): string {
  const firstUser = messages.find(m => m.role === "user")
  if (!firstUser) return "New chat"
  const text = typeof firstUser.content === "string"
    ? firstUser.content
    : firstUser.parts?.find((p: any) => p.type === "text")?.text ?? ""
  return text.slice(0, 40) || "New chat"
}

// -- Hook: conversation manager ----------------------------------------------

function useConversationManager() {
  const [history, setHistory] = useState<StoredConversation[]>([])

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  const saveConversation = useCallback((id: string, messages: any[]) => {
    if (messages.length === 0) return

    setHistory(prev => {
      const existing = prev.find(c => c.id === id)
      const updated: StoredConversation = existing
        ? { ...existing, messages }
        : { id, title: deriveTitle(messages), createdAt: Date.now(), messages }

      const next = [updated, ...prev.filter(c => c.id !== id)]
      saveHistory(next)
      return next
    })
  }, [])

  return { history, saveConversation }
}

// -- Focusable reasoning block -----------------------------------------------

function FocusableReasoning({ id, reasoningText, isThinking, disabled = false }: {
  id: string
  reasoningText: string
  isThinking: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const { isFocused, isSelected, isAnySelected, focusId, focusRef } = useFocus({ id, disabled })

  useKeyboard((event) => {
    if (event.name === "return") {
      setOpen(o => !o)
      event.preventDefault()
    }
  }, { focusId, selectedOnly: true })

  useShortcuts(
    isSelected
      ? [{ key: "enter", label: "toggle" }, { key: "esc", label: "back" }]
      : [],
    focusId,
  )

  const { borderColor, borderStyle } = useFocusBorderStyle({ isFocused, isSelected, isAnySelected })

  return (
    <box ref={focusRef} border borderStyle={borderStyle} borderColor={borderColor}>
      <ChainOfThought open={isThinking || open} onOpenChange={setOpen}>
        <ChainOfThoughtHeader>{isThinking ? "Thinking" : "Thought for"}</ChainOfThoughtHeader>
        <ChainOfThoughtContent>
          <ChainOfThoughtStep
            label="Reasoning"
            status={isThinking ? "running" : "done"}
            isLast
          >
            {!isThinking && reasoningText ? reasoningText : undefined}
          </ChainOfThoughtStep>
        </ChainOfThoughtContent>
      </ChainOfThought>
    </box>
  )
}

// -- Focusable prompt section ------------------------------------------------

function FocusablePrompt({ onSubmit, onStop, status, model, disabled = false }: {
  onSubmit: (msg: any) => void
  onStop: () => void
  status: ChatStatus
  model?: string
  disabled?: boolean
}) {
  const { isFocused, isSelected, isAnySelected, focusId, focusRef, focus, select } = useFocus({ id: "prompt", disabled })
  const capturePrompt = useCapturedKeyboard(focusId)

  useEffect(() => {
    if (!disabled) {
      const t = setTimeout(() => {
        focus()
        select()
      }, 0)
      return () => clearTimeout(t)
    }
  }, [disabled]) // re-run when entering interaction mode

  useShortcuts(
    isSelected
      ? [{ key: "esc", label: "back" }]
      : isFocused
      ? [{ key: "enter", label: "select" }]
      : [],
    focusId,
  )

  const { dividerColor, dividerDashed } = useFocusDividerStyle({ isFocused, isSelected, isAnySelected })

  return (
    <box ref={focusRef} flexShrink={0} overflow="hidden">
      <PromptInput
        onSubmit={onSubmit}
        onStop={onStop}
        status={status}
        placeholder="Type a message..."
        focus={isSelected}
        useKeyboard={capturePrompt}
        showDividers
        dividerColor={dividerColor}
        dividerDashed={dividerDashed}
        model={model}
      />
    </box>
  )
}

// -- Message area ------------------------------------------------------------

function MessageArea({ messages, isStreaming, disabled = false }: {
  messages: any[]
  isStreaming: boolean
  disabled?: boolean
}) {
  return (
    <scrollbox
      stickyScroll
      stickyStart="bottom"
      scrollY
      paddingX={1}
      paddingBottom={1}
      flexGrow={1}
      flexShrink={1}
      overflow="hidden"
      minHeight={0}
      contentOptions={{
        gap: 1,
        justifyContent: "flex-end",
        flexDirection: "column",
      }}
    >
      {messages.map((msg, i) => {
        const isLast = i === messages.length - 1
        const msgStreaming = isLast && msg.role === "assistant" && isStreaming
        const reasoningParts = msg.parts?.filter((p: any) => p.type === "reasoning") ?? []
        const reasoningText = reasoningParts.map((p: any) => p.text || "").join("\n").trim()
        const isThinking = reasoningParts.some((p: any) => p.state === "streaming")
        const hasReasoning = reasoningParts.length > 0

        if (msg.parts?.length) {
          const { content } = renderPartsWithReasoning(msg.parts, msgStreaming, { expanded: true })
          return (
            <box key={msg.id} flexDirection="column" flexShrink={0} width="100%">
              {hasReasoning && (
                <FocusableReasoning
                  id={`${COT_PREFIX}${msg.id}`}
                  reasoningText={reasoningText}
                  isThinking={isThinking}
                  disabled={disabled}
                />
              )}
              <Message
                role={msg.role as "user" | "assistant"}
                isStreaming={msgStreaming}
              >
                <Message.Content>{content}</Message.Content>
              </Message>
            </box>
          )
        }

        return (
          <Message
            key={msg.id}
            role={msg.role as "user" | "assistant"}
            isStreaming={msgStreaming}
          >
            <Message.Content>
              {typeof msg.content === "string" && (
                <Message.Text isLast={msgStreaming}>{msg.content}</Message.Text>
              )}
            </Message.Content>
          </Message>
        )
      })}
    </scrollbox>
  )
}

// -- Chat panel --------------------------------------------------------------

function ChatPanelCommands({ setShowModelPicker, setMessages }: {
  setShowModelPicker: (v: boolean) => void
  setMessages: (msgs: any[]) => void
}) {
  const commands = useMemo(() => [
    { cmd: "/model", desc: "Switch model", group: "builtin", onExecute: () => setShowModelPicker(true) },
    { cmd: "/clear", desc: "Clear conversation", group: "builtin", onExecute: () => setMessages([]) },
  ], [setShowModelPicker, setMessages])

  useRegisterCommands(commands)
  return null
}

const MODEL_ITEMS = chatModels.map(m => ({
  label: m.name,
  value: m.id,
  description: m.description,
}))

function ChatPanel({ conversationId, initialMessages, onMessagesChange, onModelChange, selectedModelId, isInteracting, transport }: {
  conversationId: string
  initialMessages: any[]
  onMessagesChange: (id: string, messages: any[]) => void
  onModelChange: (modelId: string) => void
  selectedModelId: string
  isInteracting: boolean
  transport: any
}) {
  const [showModelPicker, setShowModelPicker] = useState(false)

  const selectedModel = getModelById(selectedModelId)
  const { messages, status, sendMessage, stop, setMessages } = useChat({
    id: conversationId,
    transport,
    messages: initialMessages,
  })

  const handleSubmit = useCallback((input: any) => {
    sendMessage(input, {
      body: { model: selectedModelId, reasoning: selectedModel?.supportsReasoning ?? false },
    })
  }, [sendMessage, selectedModelId, selectedModel])

  const handleModelSelect = useCallback((modelId: string) => {
    onModelChange(modelId)
    setShowModelPicker(false)
  }, [onModelChange])

  const prevLenRef = useRef(initialMessages.length)
  useEffect(() => {
    if (messages.length > 0 && messages.length !== prevLenRef.current) {
      prevLenRef.current = messages.length
      onMessagesChange(conversationId, messages)
    }
  }, [messages.length, conversationId, onMessagesChange, messages])

  const prevStatusRef = useRef(status)
  useEffect(() => {
    const wasActive = prevStatusRef.current === "streaming" || prevStatusRef.current === "submitted"
    prevStatusRef.current = status
    if (wasActive && status === "ready" && messages.length > 0) {
      onMessagesChange(conversationId, messages)
    }
  }, [status, onMessagesChange, conversationId, messages])

  const chatStatus = toChatStatus(status)
  const modelDisplay = selectedModel?.name ?? selectedModelId

  if (showModelPicker) {
    return (
      <box flexDirection="column" flexGrow={1} justifyContent="center" alignItems="center" padding={2}>
        <box width={40}>
          <Modal title="Select model" useKeyboard={useKeyboard} onClose={() => setShowModelPicker(false)}>
            <SelectInput
              items={MODEL_ITEMS}
              defaultValue={selectedModelId}
              useKeyboard={useKeyboard}
              onSubmit={handleModelSelect}
            />
          </Modal>
        </box>
      </box>
    )
  }

  return (
    <CommandProvider>
      <ChatPanelCommands setShowModelPicker={setShowModelPicker} setMessages={setMessages} />
      <box flexDirection="column" flexGrow={1} overflow="hidden">
        <MessageArea messages={messages} isStreaming={chatStatus === "streaming"} disabled={!isInteracting} />
        <FocusablePrompt
          onSubmit={handleSubmit}
          onStop={stop}
          status={chatStatus}
          model={modelDisplay}
          disabled={!isInteracting}
        />
      </box>
    </CommandProvider>
  )
}

// -- Nav items builder -------------------------------------------------------

function buildNavItems(history: StoredConversation[]) {
  return [
    { id: "new-chat", name: "New chat", suffix: "+" },
    ...history.map(c => ({ id: c.id, name: c.title })),
  ]
}

// -- SideNav content ---------------------------------------------------------

function SideNavContent({
  activeItem,
  isInteracting,
  history,
  newChatId,
  onNewChatNeeded,
  onMessagesChange,
  onModelChange,
  selectedModelId,
  transport,
}: {
  activeItem: { id: string; name: string }
  isInteracting: boolean
  history: StoredConversation[]
  newChatId: string
  onNewChatNeeded: () => void
  onMessagesChange: (id: string, messages: any[]) => void
  onModelChange: (modelId: string) => void
  selectedModelId: string
  transport: any
}) {
  const prevActiveItemId = useRef(activeItem.id)

  useEffect(() => {
    if (prevActiveItemId.current !== "new-chat" && activeItem.id === "new-chat") {
      const isReturnFromCurrentConvo = prevActiveItemId.current === newChatId
      if (!isReturnFromCurrentConvo && history.some(c => c.id === newChatId)) {
        onNewChatNeeded()
      }
    }
    prevActiveItemId.current = activeItem.id
  }, [activeItem.id, history, newChatId, onNewChatNeeded])

  const isNewChat = activeItem.id === "new-chat"
  const convoId = isNewChat ? newChatId : activeItem.id
  const initialMsgs = isNewChat
    ? []
    : (history.find(c => c.id === activeItem.id)?.messages ?? [])

  return (
    <ChatPanel
      key={convoId}
      conversationId={convoId}
      initialMessages={initialMsgs}
      onMessagesChange={onMessagesChange}
      onModelChange={onModelChange}
      selectedModelId={selectedModelId}
      isInteracting={isInteracting}
      transport={transport}
    />
  )
}

// -- Main app ----------------------------------------------------------------

export function AIChatInterfaceApp({ transport }: { transport: any }) {
  const { history, saveConversation } = useConversationManager()
  const [newChatId, setNewChatId] = useState(() => `chat-${Date.now()}`)
  const [selectedModelId, setSelectedModelId] = useState(loadSelectedModel)
  const [requestedActiveId, setRequestedActiveId] = useState<string | undefined>()
  const lastAutoNavIdRef = useRef<string | undefined>()

  const navItems = useMemo(() => buildNavItems(history), [history])

  const handleMessagesChange = useCallback((id: string, messages: any[]) => {
    saveConversation(id, messages)
    if (id !== lastAutoNavIdRef.current) {
      lastAutoNavIdRef.current = id
      setRequestedActiveId(id)
    }
  }, [saveConversation])

  const handleModelChange = useCallback((modelId: string) => {
    saveSelectedModel(modelId)
    setSelectedModelId(modelId)
  }, [])

  return (
    <SideNav
      items={navItems}
      sidebarWidth={22}
      requestedActiveId={requestedActiveId}
      showHeader={false}
    >
      {({ activeItem, isInteracting }) => (
        <SideNavContent
          activeItem={activeItem}
          isInteracting={isInteracting}
          history={history}
          newChatId={newChatId}
          onNewChatNeeded={() => setNewChatId(`chat-${Date.now()}`)}
          onMessagesChange={handleMessagesChange}
          onModelChange={handleModelChange}
          selectedModelId={selectedModelId}
          transport={transport}
        />
      )}
    </SideNav>
  )
}
