// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { useState, useCallback, useRef } from "react"
import { useKeyboard } from "@opentui/react"
import {
  Gradient, GRADIENTS, type GradientName,
  StatusBar, textStyle,
  Table,
  Spinner, SpinnerPicker, SpinnerShowcase,
  SelectInput,
  MultiSelect,
  ChatInput,
  TextInput,
  LinkDemo as LinkDemoComponent,
  Link, type UnderlineStyle,
  TabBar,
  Modal,
  ChatPanel,
  type ChatMessage,
  type ToolCallInfo,
} from "../components/index"
import { LandingApp } from "../../docs/components/landing"
import figlet from "figlet"
// @ts-ignore
import ansiShadow from "figlet/importable-fonts/ANSI Shadow.js"
// @ts-ignore
import big from "figlet/importable-fonts/Big.js"
// @ts-ignore
import doom from "figlet/importable-fonts/Doom.js"
// @ts-ignore
import slant from "figlet/importable-fonts/Slant.js"
// @ts-ignore
import speed from "figlet/importable-fonts/Speed.js"
// @ts-ignore
import standard from "figlet/importable-fonts/Standard.js"
// @ts-ignore
import block from "figlet/importable-fonts/Block.js"
// @ts-ignore
import colossal from "figlet/importable-fonts/Colossal.js"

// ── Figlet setup ──────────────────────────────────────────────────────────
const fonts = [
  { name: "ANSI Shadow", data: ansiShadow },
  { name: "Standard", data: standard },
  { name: "Big", data: big },
  { name: "Doom", data: doom },
  { name: "Slant", data: slant },
  { name: "Speed", data: speed },
  { name: "Block", data: block },
  { name: "Colossal", data: colossal },
] as const

for (const f of fonts) {
  figlet.parseFont(f.name, f.data)
}

function getFigletLines(fontName: string, text: string = "gridland") {
  const art = figlet.textSync(text, { font: fontName as any })
  return art.split("\n").filter((l: string) => l.trimEnd().length > 0)
}

const gradientNames = Object.keys(GRADIENTS) as GradientName[]

// ── Demo App Components ───────────────────────────────────────────────────

export function GradientApp() {
  const [index, setIndex] = useState(0)
  const name = gradientNames[index]
  const lines = getFigletLines("ANSI Shadow")

  useKeyboard((event) => {
    if (event.name === "left") setIndex((i) => (i > 0 ? i - 1 : gradientNames.length - 1))
    if (event.name === "right") setIndex((i) => (i < gradientNames.length - 1 ? i + 1 : 0))
  })

  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1} flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <Gradient name={name}>{lines.join("\n")}</Gradient>
      </box>
      <StatusBar
        items={[{ key: "←→", label: "gradient" }, { key: "q", label: "quit" }]}
        extra={<span style={textStyle({ fg: "cyan", bold: true })}>{name.padEnd(11)}</span>}
      />
    </box>
  )
}

export function AsciiApp() {
  const [fontIndex, setFontIndex] = useState(0)
  const font = fonts[fontIndex]
  const lines = getFigletLines(font.name)

  useKeyboard((event) => {
    if (event.name === "left") setFontIndex((i) => (i > 0 ? i - 1 : fonts.length - 1))
    if (event.name === "right") setFontIndex((i) => (i < fonts.length - 1 ? i + 1 : 0))
  })

  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1} flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        {lines.map((line: string, i: number) => (
          <text key={i} fg="#88c0d0" bold>{line}</text>
        ))}
      </box>
      <StatusBar
        items={[{ key: "←→", label: "change font" }, { key: "q", label: "quit" }]}
        extra={<span style={textStyle({ fg: "cyan", bold: true })}>{font.name.padEnd(11)}</span>}
      />
    </box>
  )
}

export function TableApp() {
  const data = [
    { name: "Alice", role: "Engineer", status: "Active" },
    { name: "Bob", role: "Designer", status: "Active" },
    { name: "Charlie", role: "PM", status: "Away" },
  ]
  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1} flexGrow={1}>
        <Table data={data} headerColor="cyan" borderColor="#5e81ac" />
      </box>
      <StatusBar items={[{ key: "q", label: "quit" }]} />
    </box>
  )
}

export function SpinnerApp() {
  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexGrow={1}>
        <SpinnerPicker useKeyboard={useKeyboard} />
      </box>
      <StatusBar items={[{ key: "←→", label: "change variant" }, { key: "q", label: "quit" }]} />
    </box>
  )
}

export function SelectInputApp() {
  const [submitted, setSubmitted] = useState(false)
  const items = [
    { label: "TypeScript", value: "ts" },
    { label: "JavaScript", value: "js" },
    { label: "Python", value: "py" },
    { label: "Rust", value: "rs" },
  ]
  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1} flexDirection="column" flexGrow={1}>
        <SelectInput items={items} title="Choose a language" useKeyboard={useKeyboard} onSubmit={() => setSubmitted(true)} />
      </box>
      <StatusBar items={submitted
        ? [{ key: "q", label: "quit" }]
        : [
          { key: "↑↓", label: "select" },
          { key: "enter", label: "submit" },
          { key: "q", label: "quit" },
        ]
      } />
    </box>
  )
}

export function MultiSelectApp() {
  const [submitted, setSubmitted] = useState(false)
  const items = [
    { label: "TypeScript", value: "ts" },
    { label: "JavaScript", value: "js" },
    { label: "Python", value: "py" },
    { label: "Rust", value: "rs" },
  ]
  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1} flexDirection="column" flexGrow={1}>
        <MultiSelect items={items} title="Select languages" useKeyboard={useKeyboard} onSubmit={() => setSubmitted(true)} />
      </box>
      <StatusBar items={submitted
        ? [{ key: "q", label: "quit" }]
        : [
          { key: "↑↓", label: "move" },
          { key: "enter", label: "select" },
          { key: "a", label: "all" },
          { key: "x", label: "clear" },
          { key: "q", label: "quit" },
        ]
      } />
    </box>
  )
}

export function ChatInputApp() {
  const [lastMessage, setLastMessage] = useState("")
  const commands = [
    { cmd: "/help", desc: "Show commands" },
    { cmd: "/model", desc: "Switch model" },
    { cmd: "/clear", desc: "Clear conversation" },
  ]
  const files = ["src/index.ts", "src/routes.ts", "src/auth.ts", "package.json"]

  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1} flexDirection="column" flexGrow={1}>
        {lastMessage ? (
          <text>
            <span>{"Sent: "}</span>
            <span>{lastMessage}</span>
          </text>
        ) : (
          <text style={textStyle({ dim: true })}>Type a message and press enter</text>
        )}
      </box>
      <box paddingX={1}>
        <ChatInput
          commands={commands}
          files={files}
          placeholder="Message Claude..."
          showDividers
          useKeyboard={useKeyboard}
          onSubmit={(text) => setLastMessage(text)}
        />
      </box>
      <box paddingX={1}>
        <text>
          <span style={textStyle({ fg: "#C4A8FF" })}>{"[⊡_⊡]"}</span>
          <span style={textStyle({ dim: true })}>{" opus"}</span>
        </text>
      </box>
      <StatusBar items={[
        { key: "⏎", label: "send" },
        { key: "/", label: "commands" },
        { key: "@", label: "files" },
        { key: "↑", label: "history" },
        { key: "ctrl+k", label: "model" },
        { key: "q", label: "quit" },
      ]} />
    </box>
  )
}

export function TextInputApp() {
  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1} flexDirection="column" gap={1} flexGrow={1}>
        <text fg="#d8dee9" bold>Enter your name:</text>
        <TextInput placeholder="Type something..." prompt="> " />
      </box>
      <StatusBar items={[{ key: "q", label: "quit" }]} />
    </box>
  )
}

export function LinkApp() {
  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1} flexGrow={1}>
        <LinkDemoComponent useKeyboard={useKeyboard} />
      </box>
      <StatusBar items={[{ key: "q", label: "quit" }]} />
    </box>
  )
}

export function TabBarApp() {
  const tabs = ["Files", "Search", "Git", "Debug"]
  const [selectedIndex, setSelectedIndex] = useState(0)

  useKeyboard((event) => {
    if (event.name === "left") setSelectedIndex((i) => (i > 0 ? i - 1 : tabs.length - 1))
    if (event.name === "right") setSelectedIndex((i) => (i < tabs.length - 1 ? i + 1 : 0))
  })

  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="column" gap={1} padding={1} flexGrow={1}>
        <TabBar label="View" options={tabs} selectedIndex={selectedIndex} />
        <text style={textStyle({ dim: true })}>Use ←/→ arrow keys to switch tabs</text>
      </box>
      <StatusBar items={[{ key: "←→", label: "switch tab" }, { key: "q", label: "quit" }]} />
    </box>
  )
}

export function StatusBarApp() {
  const shortcuts = [
    { key: "Tab", label: "switch focus" },
    { key: "←→", label: "cycle" },
    { key: "b", label: "back" },
    { key: "z", label: "reset" },
  ]
  const [lastKey, setLastKey] = useState<string | null>(null)

  useKeyboard((event) => {
    if (event.name === "tab") setLastKey("switch focus (Tab)")
    else if (event.name === "left") setLastKey("cycle (←)")
    else if (event.name === "right") setLastKey("cycle (→)")
    else if (event.name === "b") setLastKey("back (b)")
    else if (event.name === "z") setLastKey("reset (z)")
  })

  return (
    <box flexDirection="column" gap={1} padding={1}>
      {lastKey ? (
        <text>
          <span>Pressed: </span>
          <span style={textStyle({ bold: true, fg: "cyan" })}>{lastKey}</span>
        </text>
      ) : (
        <text style={textStyle({ dim: true })}>Press a key to trigger an action</text>
      )}
      <StatusBar
        items={[...shortcuts, { key: "q", label: "quit" }]}
        extra={<span style={textStyle({ fg: "green" })}>● Ready</span>}
      />
    </box>
  )
}

export function ModalApp() {
  const [isOpen, setIsOpen] = useState(false)

  useKeyboard((event) => {
    if (!isOpen && event.name === "m") setIsOpen(true)
    if (isOpen && (event.name === "q" || event.name === "escape")) setIsOpen(false)
  })

  if (isOpen) {
    return (
      <box flexDirection="column" flexGrow={1}>
        <Modal title="Example Modal" borderColor="blue" useKeyboard={useKeyboard} onClose={() => setIsOpen(false)}>
          <box paddingX={1} flexDirection="column">
            <text>This is a modal overlay component.</text>
            <text> </text>
            <text style={textStyle({ dim: true })}>It stretches to fill the full terminal height.</text>
          </box>
        </Modal>
        <StatusBar items={[{ key: "q", label: "close" }, { key: "Esc", label: "quit" }]} />
      </box>
    )
  }

  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center">
        <text>
          <span style={textStyle({ dim: true })}>Press </span>
          <span style={textStyle({ inverse: true, bold: true })}> m </span>
          <span style={textStyle({ dim: true })}> to open modal</span>
        </text>
      </box>
      <StatusBar items={[{ key: "m", label: "open modal" }, { key: "q", label: "quit" }]} />
    </box>
  )
}

export function PrimitivesApp() {
  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="column" padding={1} flexGrow={1}>
        <box border borderStyle="rounded" borderColor="#5e81ac" title="Layout" titleAlignment="center" padding={1}>
          <box flexDirection="row" gap={2}>
            <box border borderStyle="single" borderColor="#a3be8c" padding={1} flexGrow={1}>
              <text fg="#a3be8c" bold>Box 1</text>
            </box>
            <box border borderStyle="single" borderColor="#ebcb8b" padding={1} flexGrow={1}>
              <text fg="#ebcb8b" bold>Box 2</text>
            </box>
            <box border borderStyle="single" borderColor="#b48ead" padding={1} flexGrow={1}>
              <text fg="#b48ead" bold>Box 3</text>
            </box>
          </box>
        </box>
        <text fg="#d8dee9" dim>{"  Nested boxes with borders, colors & flexbox layout"}</text>
      </box>
      <StatusBar items={[{ key: "q", label: "quit" }]} />
    </box>
  )
}

export function TerminalWindowApp() {
  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="column" padding={1} flexGrow={1}>
        <text style={textStyle({ fg: "green" })}>$ echo "Hello from OpenTUI"</text>
        <text>Hello from OpenTUI</text>
        <text style={textStyle({ fg: "green" })}>$ _</text>
      </box>
      <StatusBar items={[{ key: "q", label: "quit" }]} />
    </box>
  )
}

const initialChatMessages: ChatMessage[] = [
  { id: "1", role: "user", content: "Show me my portfolio" },
  { id: "2", role: "assistant", content: "Here's your current portfolio allocation:" },
  { id: "3", role: "user", content: "Calculate rebalancing trades" },
  { id: "4", role: "assistant", content: "I've calculated the optimal trades to rebalance your portfolio." },
]

let chatNextId = 5

export function ChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCallInfo[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleSend = useCallback((text: string) => {
    const userMsg: ChatMessage = { id: String(chatNextId++), role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    const toolCallId = `tc-${chatNextId}`

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
            { id: String(chatNextId++), role: "assistant", content: response },
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
    <box flexDirection="column" flexGrow={1}>
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
      <StatusBar items={[{ key: "q", label: "quit" }]} />
    </box>
  )
}

// ── Demo registry ─────────────────────────────────────────────────────────

export interface Demo {
  name: string
  app: () => JSX.Element
}

export const demos: Demo[] = [
  { name: "gradient", app: () => <GradientApp /> },
  { name: "ascii", app: () => <AsciiApp /> },
  { name: "table", app: () => <TableApp /> },
  { name: "spinner", app: () => <SpinnerApp /> },
  { name: "select-input", app: () => <SelectInputApp /> },
  { name: "multi-select", app: () => <MultiSelectApp /> },
  { name: "chat-input", app: () => <ChatInputApp /> },
  { name: "text-input", app: () => <TextInputApp /> },
  { name: "link", app: () => <LinkApp /> },
  { name: "tab-bar", app: () => <TabBarApp /> },
  { name: "status-bar", app: () => <StatusBarApp /> },
  { name: "modal", app: () => <ModalApp /> },
  { name: "primitives", app: () => <PrimitivesApp /> },
  { name: "chat", app: () => <ChatApp /> },
  { name: "terminal", app: () => <TerminalWindowApp /> },
  { name: "landing", app: () => <LandingApp useKeyboard={useKeyboard} /> },
]
