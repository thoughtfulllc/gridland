// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { useState, useCallback, useRef, useEffect } from "react"
import { useKeyboard } from "@gridland/utils"
import {
  Gradient, GRADIENTS, type GradientName,
  StatusBar, textStyle, useTheme,
  Table,
  Spinner, SpinnerPicker, SpinnerShowcase,
  SelectInput,
  MultiSelect,
  PromptInput,
  TextInput,
  LinkDemo as LinkDemoComponent,
  Link, type UnderlineStyle,
  TabBar,
  Modal,
  ChatPanel,
  Message,
  ChainOfThought, ChainOfThoughtHeader, ChainOfThoughtContent, ChainOfThoughtStep,
  type ChatMessage,
  type ToolCallInfo,
  type Step,
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
      <box paddingX={1} paddingBottom={1}>
        <StatusBar
          items={[{ key: "←→", label: "gradient" }, { key: "q", label: "quit" }]}
          extra={<span style={textStyle({ fg: "cyan", bold: true })}>{name.padEnd(11)}</span>}
        />
      </box>
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
      <box paddingX={1} paddingBottom={1}>
        <StatusBar
          items={[{ key: "←→", label: "change font" }, { key: "q", label: "quit" }]}
          extra={<span style={textStyle({ fg: "cyan", bold: true })}>{font.name.padEnd(11)}</span>}
        />
      </box>
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
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "q", label: "quit" }]} />
      </box>
    </box>
  )
}

export function SpinnerApp() {
  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexGrow={1}>
        <SpinnerPicker useKeyboard={useKeyboard} />
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "←→", label: "change variant" }, { key: "q", label: "quit" }]} />
      </box>
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
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={submitted
          ? [{ key: "q", label: "quit" }]
          : [
            { key: "↑↓", label: "select" },
            { key: "enter", label: "submit" },
            { key: "q", label: "quit" },
          ]
        } />
      </box>
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
      <box paddingX={1} paddingBottom={1}>
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
    </box>
  )
}

export function PromptInputApp() {
  const [lastMessage, setLastMessage] = useState("")
  const [model, setModel] = useState("opus")
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const commands = [
    { cmd: "/help", desc: "Show commands" },
    { cmd: "/model", desc: "Switch model" },
    { cmd: "/clear", desc: "Clear conversation" },
  ]
  const files = ["src/index.ts", "src/routes.ts", "src/auth.ts", "package.json"]
  const models = [
    { label: "Claude Opus", value: "opus" },
    { label: "Claude Sonnet", value: "sonnet" },
    { label: "Claude Haiku", value: "haiku" },
  ]

  const handleSubmit = (msg: { text: string }) => {
    if (msg.text === "/model") {
      setShowModelPicker(true)
      setResetKey((k) => k + 1)
      return
    }
    if (msg.text === "/clear") {
      setLastMessage("")
      setResetKey((k) => k + 1)
      return
    }
    setLastMessage(msg.text)
  }

  if (showModelPicker) {
    return (
      <box flexDirection="column" flexGrow={1}>
        <Modal
          title="Select Model"
          useKeyboard={useKeyboard}
          onClose={() => setShowModelPicker(false)}
        >
          <box paddingX={1}>
            <SelectInput
              items={models}
              defaultValue={model}
              useKeyboard={useKeyboard}
              onSubmit={(value) => {
                setModel(value)
                setShowModelPicker(false)
              }}
            />
          </box>
        </Modal>
        <box paddingX={1} paddingBottom={1}>
          <StatusBar items={[
            { key: "⏎", label: "select" },
            { key: "esc", label: "cancel" },
            { key: "q", label: "quit" },
          ]} />
        </box>
      </box>
    )
  }

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
        <PromptInput
          key={resetKey}
          commands={commands}
          files={files}
          placeholder="Message Claude..."
          showDividers
          useKeyboard={useKeyboard}
          onSubmit={handleSubmit}
        />
      </box>
      <box paddingX={1}>
        <text>
          <span style={textStyle({ fg: "#C4A8FF" })}>{"[⊡_⊡]"}</span>
          <span style={textStyle({ dim: true })}>{" " + model}</span>
        </text>
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[
          { key: "⏎", label: "send" },
          { key: "/", label: "commands" },
          { key: "@", label: "files" },
          { key: "↑", label: "history" },
          { key: "q", label: "quit" },
        ]} />
      </box>
    </box>
  )
}

const TEXT_INPUT_FIELDS = [
  { label: "Username", placeholder: "enter your name", maxLength: 30, required: true },
  { label: "Email", placeholder: "user@example.com", maxLength: 50, required: true, description: "We'll never share your email" },
  { label: "Password", placeholder: "enter password", maxLength: 40 },
  { label: "API Key", placeholder: "sk-...", maxLength: 60, disabled: true },
] as const

export function TextInputApp() {
  const [activeField, setActiveField] = useState(0)
  const [values, setValues] = useState(TEXT_INPUT_FIELDS.map(() => ""))

  useKeyboard((event) => {
    if (event.name === "up") setActiveField((i) => Math.max(0, i - 1))
    if (event.name === "down" || event.name === "tab") setActiveField((i) => Math.min(TEXT_INPUT_FIELDS.length - 1, i + 1))
  })

  return (
    <box flexDirection="column" flexGrow={1}>
      <box paddingX={1} paddingTop={1}>
        <text>
          <span style={textStyle({ fg: "#FF71CE", bold: true })}>{"TextInput"}</span>
          <span style={textStyle({ dim: true })}>{"  Form with multiple input types"}</span>
        </text>
      </box>

      <box flexDirection="column" paddingX={1} paddingTop={1} flexGrow={1}>
        {TEXT_INPUT_FIELDS.map((field, i) => (
          <box key={field.label} marginBottom={1}>
            <TextInput
              label={field.label}
              placeholder={field.placeholder}
              prompt="> "
              focus={i === activeField}
              maxLength={field.maxLength}
              value={values[i]}
              onChange={(v) => setValues((prev) => prev.map((old, j) => j === i ? v : old))}
              required={field.required}
              disabled={field.disabled}
              description={field.description}
            />
          </box>
        ))}
      </box>

      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[
          { key: "↑↓", label: "field" },
          { key: "←→", label: "cursor" },
          { key: "tab", label: "complete" },
          { key: "^k/^u", label: "kill" },
        ]} />
      </box>
    </box>
  )
}

export function LinkApp() {
  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1} flexGrow={1}>
        <LinkDemoComponent useKeyboard={useKeyboard} />
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "q", label: "quit" }]} />
      </box>
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
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "←→", label: "switch tab" }, { key: "q", label: "quit" }]} />
      </box>
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
        <box paddingX={1} paddingBottom={1}>
          <StatusBar items={[{ key: "q", label: "close" }, { key: "Esc", label: "quit" }]} />
        </box>
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
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "m", label: "open modal" }, { key: "q", label: "quit" }]} />
      </box>
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
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "q", label: "quit" }]} />
      </box>
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
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "q", label: "quit" }]} />
      </box>
    </box>
  )
}

const COT_STEPS: (Step & { delay: number })[] = [
  { tool: "Read", label: "Reading codebase", description: "src/", status: "done", delay: 1800 },
  { tool: "Think", label: "Planning changes", description: "auth module", status: "done", delay: 2500 },
  { tool: "Edit", label: "Editing files", description: "4 files", status: "done", delay: 3200 },
  { tool: "Bash", label: "Running tests", description: "vitest", status: "done", delay: 2000 },
  { tool: "Edit", label: "Fixing test", description: "routes.test.ts", status: "done", delay: 1500 },
]

type ChainOfThoughtPhase = "running" | "done"

export function ChainOfThoughtApp() {
  const [expanded, setExpanded] = useState(true)
  const [phase, setPhase] = useState<ChainOfThoughtPhase>("running")
  const [stepIndex, setStepIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useKeyboard((event) => {
    if (event.name === "E" && event.ctrl && event.shift) setExpanded((v) => !v)
    if (event.name === "r") cotRestart()
  })

  function cotRestart() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPhase("running")
    setStepIndex(0)
  }

  useEffect(() => {
    if (phase !== "running") return
    if (stepIndex < COT_STEPS.length) {
      const delay = COT_STEPS[stepIndex]!.delay
      timerRef.current = setTimeout(() => setStepIndex((i) => i + 1), delay)
    } else {
      timerRef.current = setTimeout(() => setPhase("done"), 500)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase, stepIndex])

  useEffect(() => {
    if (phase === "done") {
      timerRef.current = setTimeout(() => cotRestart(), 3000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase])

  const steps: Step[] = COT_STEPS.map((s, i) => {
    if (i < stepIndex) return { ...s, status: "done" as const }
    if (i === stepIndex && phase === "running") return { ...s, status: "running" as const }
    return { ...s, status: phase === "done" ? ("done" as const) : ("pending" as const) }
  })

  const elapsedMs = COT_STEPS.slice(0, stepIndex).reduce((sum, s) => sum + s.delay, 0)
  const totalMs = COT_STEPS.reduce((sum, s) => sum + s.delay, 0)
  const durationStr = phase === "done"
    ? `${(totalMs / 1000).toFixed(1)}s`
    : `${(elapsedMs / 1000).toFixed(1)}s`

  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="column" padding={1} flexGrow={1}>
        <ChainOfThought open={expanded} onOpenChange={setExpanded}>
          <ChainOfThoughtHeader duration={durationStr} />
          <ChainOfThoughtContent>
            {steps.map((step, i) => (
              <ChainOfThoughtStep
                key={i}
                label={step.label}
                description={step.description}
                status={step.status}
                isLast={i === steps.length - 1}
              >
                {step.output}
              </ChainOfThoughtStep>
            ))}
          </ChainOfThoughtContent>
        </ChainOfThought>
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[
          { key: "ctrl+shift+e", label: "toggle" },
          { key: "r", label: "restart" },
          { key: "q", label: "quit" },
        ]} />
      </box>
    </box>
  )
}

const BUBBLE_STEPS: (Step & { delay: number })[] = [
  { tool: "Read", label: "Reading codebase", description: "src/", status: "done", delay: 1800 },
  { tool: "Think", label: "Planning changes", description: "auth module", status: "done", delay: 2500 },
  { tool: "Edit", label: "Editing files", description: "4 files", status: "done", delay: 3200 },
  { tool: "Bash", label: "Running tests", description: "vitest", status: "done", delay: 2000 },
  { tool: "Edit", label: "Fixing test", description: "routes.test.ts", status: "done", delay: 1500 },
]

const BUBBLE_RESPONSE = "I've refactored the auth module. The changes include extracting the token validation into a shared helper, consolidating the middleware chain, and updating the test suite to match."

const BUBBLE_TOTAL_MS = BUBBLE_STEPS.reduce((sum, s) => sum + s.delay, 0)

type BubblePhase = "idle" | "thinking" | "streaming" | "done"

export function MessageApp() {
  const [expanded, setExpanded] = useState(true)
  const [phase, setPhase] = useState<BubblePhase>("idle")
  const [stepIndex, setStepIndex] = useState(0)
  const [streamedText, setStreamedText] = useState("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useKeyboard((event) => {
    if (event.name === "E" && event.ctrl && event.shift) setExpanded((v) => !v)
    if (event.name === "r") bubbleRestart()
  })

  function bubbleRestart() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPhase("idle")
    setStepIndex(0)
    setStreamedText("")
  }

  useEffect(() => {
    if (phase === "idle") {
      timerRef.current = setTimeout(() => setPhase("thinking"), 800)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase])

  useEffect(() => {
    if (phase !== "thinking") return
    if (stepIndex < BUBBLE_STEPS.length) {
      const delay = BUBBLE_STEPS[stepIndex]!.delay
      timerRef.current = setTimeout(() => setStepIndex((i) => i + 1), delay)
    } else {
      timerRef.current = setTimeout(() => setPhase("streaming"), 500)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase, stepIndex])

  useEffect(() => {
    if (phase !== "streaming") return
    if (streamedText.length < BUBBLE_RESPONSE.length) {
      timerRef.current = setTimeout(() => {
        setStreamedText(BUBBLE_RESPONSE.slice(0, streamedText.length + 2))
      }, 25)
    } else {
      timerRef.current = setTimeout(() => setPhase("done"), 500)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase, streamedText])

  useEffect(() => {
    if (phase === "done") {
      timerRef.current = setTimeout(() => bubbleRestart(), 3000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase])

  const steps = BUBBLE_STEPS.map((s, i) => {
    if (i < stepIndex) return { ...s, status: "done" as const }
    if (i === stepIndex) return { ...s, status: "running" as const }
    return { ...s, status: "pending" as const }
  })

  const isThinking = phase === "thinking"
  const isStreaming = phase === "streaming"
  const isDone = phase === "done"
  const showAssistant = phase !== "idle"

  const elapsedMs = BUBBLE_STEPS.slice(0, stepIndex).reduce((sum, s) => sum + s.delay, 0)

  const reasoningDuration = isThinking
    ? `${(elapsedMs / 1000).toFixed(1)}s`
    : `${(BUBBLE_TOTAL_MS / 1000).toFixed(1)}s`
  const reasoningSteps = isThinking
    ? steps
    : BUBBLE_STEPS.map((s) => ({ ...s, status: "done" as const }))

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
            <Message.Reasoning part={{
              type: "reasoning",
              duration: reasoningDuration,
              collapsed: !expanded,
              steps: reasoningSteps,
            }} />
            {(isStreaming || isDone) && (
              <Message.Content>
                <Message.Text isLast>{isDone ? BUBBLE_RESPONSE : streamedText}</Message.Text>
              </Message.Content>
            )}
          </Message>
        )}
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "ctrl+shift+e", label: "toggle chain of thought" }, { key: "r", label: "restart" }, { key: "q", label: "quit" }]} />
      </box>
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
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "q", label: "quit" }]} />
      </box>
    </box>
  )
}

// ── Pointer Events Demo ───────────────────────────────────────────────────

const pointerColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"]
const pointerColorNames = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple"]

function HoverBox() {
  const [hovering, setHovering] = useState(false)
  return (
    <box
      border
      borderStyle="rounded"
      borderColor={hovering ? "#22c55e" : "#555"}
      width={20}
      height={5}
      onMouseOver={() => setHovering(true)}
      onMouseOut={() => setHovering(false)}
    >
      <box padding={1}>
        <text style={{ fg: hovering ? "#22c55e" : "#888", bold: hovering }}>
          {hovering ? "Mouse inside!" : "Hover me"}
        </text>
      </box>
    </box>
  )
}

export function PointerApp() {
  const [selected, setSelected] = useState<number | null>(null)
  const [clickCount, setClickCount] = useState(0)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)

  const selectedRef = useRef<number | null>(null)
  const clickCountRef = useRef(0)
  selectedRef.current = selected
  clickCountRef.current = clickCount

  useKeyboard((event) => {
    const cur = selectedRef.current ?? -1
    if (event.name === "right" || event.name === "tab") {
      const next = (cur + 1) % pointerColors.length
      selectedRef.current = next
      setSelected(next)
    } else if (event.name === "left") {
      const next = (cur - 1 + pointerColors.length) % pointerColors.length
      selectedRef.current = next
      setSelected(next)
    }
    event.preventDefault()
  })

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box flexDirection="row" gap={1}>
        {pointerColors.map((color, i) => (
          <box
            key={color}
            flexGrow={1}
            height={3}
            border
            borderStyle="rounded"
            borderColor={i === selected ? color : "#555"}
            onMouseDown={(e: any) => {
              clickCountRef.current++
              setClickCount(clickCountRef.current)
              selectedRef.current = i
              setSelected(i)
              setMousePos({ x: e.x, y: e.y })
            }}
          >
            <text style={{ fg: color, bold: i === selected }}>
              {i === selected ? `▸ ${pointerColorNames[i]}` : ` ${pointerColorNames[i]}`}
            </text>
          </box>
        ))}
      </box>
      <box height={1} />
      <box flexDirection="row" gap={2}>
        <HoverBox />
        <box flexDirection="column" flexGrow={1} paddingTop={1}>
          <text style={{ fg: selected !== null ? pointerColors[selected] : "#888" }}>
            {selected !== null ? `Clicked ${pointerColorNames[selected]}` : "Click a color"}
            {clickCount > 0 ? `  (${clickCount} clicks)` : ""}
          </text>
          <text style={{ dim: true, fg: "#888" }}>
            {mousePos ? `mouse: ${mousePos.x}, ${mousePos.y}` : ""}
          </text>
        </box>
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[
          { key: "click", label: "select" },
          { key: "←→", label: "keyboard nav" },
          { key: "q", label: "quit" },
        ]} />
      </box>
    </box>
  )
}

// ── Cursor Highlight Demo ────────────────────────────────────────────────

export function CursorHighlightApp() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  return (
    <box
      flexDirection="column"
      flexGrow={1}
      onMouseMove={(e: any) => {
        setPos({ x: e.x, y: e.y })
      }}
    >
      <box flexDirection="column" flexGrow={1} padding={1}>
        <text style={{ bold: true, fg: "#fff" }}>Cursor Highlight</text>
        <text style={{ dim: true, fg: "#888" }}>Move your mouse over the grid</text>
        <box height={1} />
        <box flexDirection="column">
          {Array.from({ length: 6 }, (_, row) => (
            <text key={row}>
              {Array.from({ length: 40 }, (_, col) => {
                const isEven = (row + col) % 2 === 0
                return (
                  <span key={col} style={{
                    fg: isEven ? "#3b82f6" : "#8b5cf6",
                    dim: !isEven,
                  }}>
                    {isEven ? "░░" : "▓▓"}
                  </span>
                )
              })}
            </text>
          ))}
        </box>
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar
          items={[{ key: "q", label: "quit" }]}
          extra={
            <span>
              <span style={textStyle({ bold: true, fg: "#1e1e2e", bg: "#888" })}>{" x "}</span>
              <span style={textStyle({ dim: true, fg: "#888" })}>{` ${pos ? String(pos.x).padStart(3) : "  -"} `}</span>
              <span style={textStyle({ bold: true, fg: "#1e1e2e", bg: "#888" })}>{" y "}</span>
              <span style={textStyle({ dim: true, fg: "#888" })}>{` ${pos ? String(pos.y).padStart(3) : "  -"}`}</span>
            </span>
          }
        />
      </box>
    </box>
  )
}

// ── Focus Navigation Demo ─────────────────────────────────────────────────

const focusPanels = [
  {
    label: "Language",
    items: [
      { label: "TypeScript", value: "ts" },
      { label: "JavaScript", value: "js" },
      { label: "Python", value: "py" },
    ],
  },
  {
    label: "Framework",
    items: [
      { label: "React", value: "react" },
      { label: "Vue", value: "vue" },
      { label: "Svelte", value: "svelte" },
    ],
  },
  {
    label: "Runtime",
    items: [
      { label: "Bun", value: "bun" },
      { label: "Node", value: "node" },
      { label: "Deno", value: "deno" },
    ],
  },
]

export function FocusApp() {
  const [panelIndex, setPanelIndex] = useState(0)
  const [entered, setEntered] = useState(false)
  const [cursors, setCursors] = useState([0, 0, 0])
  const [selections, setSelections] = useState<(string | null)[]>([null, null, null])

  const panelRef = useRef(0)
  const enteredRef = useRef(false)
  const cursorsRef = useRef([0, 0, 0])
  panelRef.current = panelIndex
  enteredRef.current = entered
  cursorsRef.current = cursors

  useKeyboard((event) => {
    const pi = panelRef.current
    if (enteredRef.current) {
      const items = focusPanels[pi].items
      const cur = cursorsRef.current[pi]
      if (event.name === "down" || event.name === "j") {
        const next = (cur + 1) % items.length
        cursorsRef.current = [...cursorsRef.current]
        cursorsRef.current[pi] = next
        setCursors([...cursorsRef.current])
      } else if (event.name === "up" || event.name === "k") {
        const next = (cur - 1 + items.length) % items.length
        cursorsRef.current = [...cursorsRef.current]
        cursorsRef.current[pi] = next
        setCursors([...cursorsRef.current])
      } else if (event.name === "return") {
        const selected = items[cursorsRef.current[pi]].label
        setSelections((s) => { const n = [...s]; n[pi] = selected; return n })
        enteredRef.current = false
        setEntered(false)
      } else if (event.name === "escape") {
        enteredRef.current = false
        setEntered(false)
      }
    } else {
      if (event.name === "right" || event.name === "tab") {
        const next = (pi + 1) % focusPanels.length
        panelRef.current = next
        setPanelIndex(next)
      } else if (event.name === "left") {
        const next = (pi - 1 + focusPanels.length) % focusPanels.length
        panelRef.current = next
        setPanelIndex(next)
      } else if (event.name === "return") {
        enteredRef.current = true
        setEntered(true)
      }
    }
    event.preventDefault()
  })

  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="row" gap={1} padding={1} flexGrow={1}>
        {focusPanels.map((panel, i) => {
          const focused = i === panelIndex
          const active = focused && entered
          const selected = selections[i]
          return (
            <box
              key={panel.label}
              border
              borderStyle="rounded"
              borderColor={active ? "#22c55e" : focused ? "#3b82f6" : "#555"}
              flexGrow={1}
            >
              <box flexDirection="column" padding={1}>
                <text style={{
                  fg: active ? "#22c55e" : focused ? "#3b82f6" : "#888",
                  bold: focused,
                }}>
                  {focused ? "▸ " : "  "}{panel.label}
                  {selected ? `: ${selected}` : ""}
                </text>
                {(active || (!entered && focused)) && (
                  <>
                    <box height={1} />
                    <box flexDirection="column">
                      {panel.items.map((item, j) => {
                        const highlighted = active && j === cursors[i]
                        return (
                          <text key={item.value} style={{
                            fg: highlighted ? "#22c55e" : active ? "#ccc" : "#666",
                            bold: highlighted,
                          }}>
                            {highlighted ? " ▸ " : "   "}{item.label}
                          </text>
                        )
                      })}
                    </box>
                  </>
                )}
              </box>
            </box>
          )
        })}
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar
          items={entered
            ? [{ key: "↑↓", label: "select" }, { key: "enter", label: "confirm" }, { key: "esc", label: "back" }, { key: "q", label: "quit" }]
            : [{ key: "←→", label: "navigate" }, { key: "enter", label: "select" }, { key: "tab", label: "next" }, { key: "q", label: "quit" }]
          }
        />
      </box>
    </box>
  )
}

// ── Text Style Demo ──────────────────────────────────────────────────────

export function TextStyleApp() {
  const theme = useTheme()
  const desc = textStyle({ fg: theme.muted })
  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="column" padding={1} gap={0} flexGrow={1}>
        <text>
          <span style={textStyle({ fg: theme.foreground, bold: true })}>bold          </span>
          <span style={desc}>textStyle({"{"} bold: true {"}"})</span>
        </text>
        <text>
          <span style={textStyle({ fg: theme.foreground, dim: true })}>dim           </span>
          <span style={desc}>textStyle({"{"} dim: true {"}"})</span>
        </text>
        <text>
          <span style={textStyle({ fg: theme.foreground, italic: true })}>italic        </span>
          <span style={desc}>textStyle({"{"} italic: true {"}"})</span>
        </text>
        <text>
          <span style={textStyle({ fg: theme.foreground, underline: true })}>underline     </span>
          <span style={desc}>textStyle({"{"} underline: true {"}"})</span>
        </text>
        <text>
          <span style={textStyle({ inverse: true })}>inverse       </span>
          <span style={desc}>textStyle({"{"} inverse: true {"}"})</span>
        </text>
        <text> </text>
        <text>
          <span style={textStyle({ fg: theme.primary })}>fg color      </span>
          <span style={desc}>textStyle({"{"} fg: theme.primary {"}"})</span>
        </text>
        <text>
          <span style={textStyle({ fg: theme.foreground, bg: theme.secondary })}>bg color      </span>
          <span style={desc}>textStyle({"{"} fg: theme.foreground, bg: theme.secondary {"}"})</span>
        </text>
        <text> </text>
        <text>
          <span style={textStyle({ fg: theme.accent, bold: true, underline: true })}>combined      </span>
          <span style={desc}>textStyle({"{"} fg: theme.accent, bold: true, underline: true {"}"})</span>
        </text>
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "q", label: "quit" }]} />
      </box>
    </box>
  )
}

// ── Headless Demo ────────────────────────────────────────────────────────

export function HeadlessApp() {
  const data = [
    { name: "Alice", role: "Engineer", status: "Active" },
    { name: "Bob", role: "Designer", status: "Active" },
    { name: "Charlie", role: "PM", status: "Away" },
  ]
  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1} flexGrow={1}>
        <Table data={data} />
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[{ key: "q", label: "quit" }]} />
      </box>
    </box>
  )
}

// ── Theming Demo ─────────────────────────────────────────────────────────

export function ThemingApp() {
  const tableData = [
    { name: "Alice", role: "Engineer", status: "Active" },
    { name: "Bob", role: "Designer", status: "Away" },
  ]
  const selectItems = [
    { label: "TypeScript", value: "ts" },
    { label: "JavaScript", value: "js" },
    { label: "Python", value: "py" },
  ]
  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="column" padding={1} gap={1} flexGrow={1}>
        <Spinner text="Loading data..." />
        <Table data={tableData} />
        <MultiSelect items={selectItems} useKeyboard={useKeyboard} />
      </box>
      <box paddingX={1} paddingBottom={1}>
        <StatusBar items={[
          { key: "↑↓", label: "move" },
          { key: "enter", label: "select" },
          { key: "q", label: "quit" },
        ]} />
      </box>
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
  { name: "prompt-input", app: () => <PromptInputApp /> },
  { name: "text-input", app: () => <TextInputApp /> },
  { name: "link", app: () => <LinkApp /> },
  { name: "tabs", app: () => <TabBarApp /> },
  { name: "status-bar", app: () => <StatusBarApp /> },
  { name: "modal", app: () => <ModalApp /> },
  { name: "primitives", app: () => <PrimitivesApp /> },
  { name: "chat", app: () => <ChatApp /> },
  { name: "chain-of-thought", app: () => <ChainOfThoughtApp /> },
  { name: "message", app: () => <MessageApp /> },
  { name: "terminal-window", app: () => <TerminalWindowApp /> },
  { name: "focus", app: () => <FocusApp /> },
  { name: "pointer", app: () => <PointerApp /> },
  { name: "cursor-highlight", app: () => <CursorHighlightApp /> },
  { name: "text-style", app: () => <TextStyleApp /> },
  { name: "headless", app: () => <HeadlessApp /> },
  { name: "theming", app: () => <ThemingApp /> },
  { name: "landing", app: () => <LandingApp useKeyboard={useKeyboard} /> },
]
