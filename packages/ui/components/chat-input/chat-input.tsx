import { useState, useRef } from "react"
import { textStyle } from "../text-style"
import { useTheme } from "../theme/index"

export interface Suggestion {
  text: string
  desc?: string
}

export interface ChatInputProps {
  /** Callback when user submits a message */
  onSubmit?: (text: string) => void
  /** Callback when input value changes */
  onChange?: (text: string) => void
  /** Placeholder text when input is empty */
  placeholder?: string
  /** Prompt character shown before input */
  prompt?: string
  /** Color of the prompt character */
  promptColor?: string
  /** Disable input (e.g. while streaming) */
  disabled?: boolean
  /** Text shown when disabled */
  disabledText?: string
  /** Slash commands for autocomplete */
  commands?: { cmd: string; desc?: string }[]
  /** File paths for @ mention autocomplete */
  files?: string[]
  /** Custom suggestion provider — overrides commands/files */
  getSuggestions?: (value: string) => Suggestion[]
  /** Max visible suggestions */
  maxSuggestions?: number
  /** Enable command history with up/down arrows */
  enableHistory?: boolean
  /** Show horizontal dividers above and below the input */
  showDividers?: boolean
  /** Keyboard hook from @opentui/react */
  useKeyboard?: (handler: (event: any) => void) => void
}

const CURSOR_CHAR = "▍"

export function ChatInput({
  onSubmit,
  onChange,
  placeholder = "Type a message...",
  prompt = "❯ ",
  promptColor,
  disabled = false,
  disabledText = "Generating...",
  commands = [],
  files = [],
  getSuggestions: customGetSuggestions,
  maxSuggestions = 5,
  enableHistory = true,
  showDividers = false,
  useKeyboard,
}: ChatInputProps) {
  const theme = useTheme()
  const resolvedPromptColor = promptColor ?? theme.muted

  const [value, setValue] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [sugIdx, setSugIdx] = useState(0)
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)

  // Refs to avoid stale closures when React batches multiple dispatches
  const valueRef = useRef("")
  const suggestionsRef = useRef<Suggestion[]>([])
  const sugIdxRef = useRef(0)
  const historyRef = useRef<string[]>([])
  const histIdxRef = useRef(-1)

  const setSug = (next: Suggestion[]) => {
    suggestionsRef.current = next
    setSuggestions(next)
  }

  const setSugI = (next: number) => {
    sugIdxRef.current = next
    setSugIdx(next)
  }

  const setHist = (next: string[]) => {
    historyRef.current = next
    setHistory(next)
  }

  const setHistI = (next: number) => {
    histIdxRef.current = next
    setHistIdx(next)
  }

  const computeSuggestions = (input: string): Suggestion[] => {
    if (customGetSuggestions) return customGetSuggestions(input)

    if (input.startsWith("/") && commands.length > 0) {
      return commands
        .filter((c) => c.cmd.startsWith(input))
        .map((c) => ({ text: c.cmd, desc: c.desc }))
    }
    if (input.includes("@") && files.length > 0) {
      const query = input.split("@").pop() ?? ""
      return files
        .filter((f) => f.toLowerCase().includes(query.toLowerCase()))
        .map((f) => ({ text: "@" + f }))
    }
    return []
  }

  const updateValue = (next: string) => {
    valueRef.current = next
    setValue(next)
    onChange?.(next)
    const sug = computeSuggestions(next)
    setSug(sug)
    setSugI(0)
  }

  useKeyboard?.((event: any) => {
    if (disabled) return

    if (event.name === "return") {
      if (suggestionsRef.current.length > 0) {
        const sel = suggestionsRef.current[sugIdxRef.current]
        if (sel) {
          if (valueRef.current.startsWith("/")) {
            // Slash commands: submit immediately on selection
            setSug([])
            updateValue("")
            if (enableHistory) {
              setHist([sel.text, ...historyRef.current])
            }
            setHistI(-1)
            onSubmit?.(sel.text)
          } else {
            const base = valueRef.current.slice(0, valueRef.current.lastIndexOf("@"))
            updateValue(base + sel.text + " ")
            setSug([])
          }
        }
      } else {
        const trimmed = valueRef.current.trim()
        if (!trimmed) return
        onSubmit?.(trimmed)
        if (enableHistory) {
          setHist([trimmed, ...historyRef.current])
        }
        updateValue("")
        setHistI(-1)
        setSug([])
      }
      return
    }

    if (event.name === "tab" && suggestionsRef.current.length > 0) {
      setSugI((sugIdxRef.current + 1) % suggestionsRef.current.length)
      return
    }

    if (event.name === "up") {
      if (suggestionsRef.current.length > 0) {
        setSugI(Math.max(0, sugIdxRef.current - 1))
      } else if (enableHistory && historyRef.current.length > 0) {
        const idx = Math.min(historyRef.current.length - 1, histIdxRef.current + 1)
        setHistI(idx)
        updateValue(historyRef.current[idx]!)
      }
      return
    }

    if (event.name === "down") {
      if (suggestionsRef.current.length > 0) {
        setSugI(Math.min(suggestionsRef.current.length - 1, sugIdxRef.current + 1))
      } else if (enableHistory && histIdxRef.current > 0) {
        const nextIdx = histIdxRef.current - 1
        setHistI(nextIdx)
        updateValue(historyRef.current[nextIdx]!)
      } else if (enableHistory && histIdxRef.current === 0) {
        setHistI(-1)
        updateValue("")
      }
      return
    }

    if (event.name === "escape") {
      if (suggestionsRef.current.length > 0) {
        setSug([])
      }
      return
    }

    if (event.name === "backspace" || event.name === "delete") {
      updateValue(valueRef.current.slice(0, -1))
      return
    }

    if (event.ctrl || event.meta) return

    if (event.name === "space") {
      updateValue(valueRef.current + " ")
      return
    }

    if (event.name && event.name.length === 1) {
      updateValue(valueRef.current + event.name)
    }
  })

  const visibleSuggestions = suggestions.slice(0, maxSuggestions)

  return (
    <box flexDirection="column">
      {showDividers && (
        <text wrapMode="none"><span style={textStyle({ dim: true, fg: theme.muted })}>{"─".repeat(500)}</span></text>
      )}

      {visibleSuggestions.length > 0 && (
        <box flexDirection="column" marginLeft={2}>
          {visibleSuggestions.map((sug, i) => {
            const active = i === sugIdx
            return (
              <text key={sug.text}>
                <span style={textStyle({ fg: active ? theme.primary : theme.muted })}>
                  {active ? "▸ " : "  "}
                </span>
                <span style={textStyle({ fg: active ? theme.primary : theme.muted, bold: active })}>
                  {sug.text}
                </span>
                {sug.desc && (
                  <span style={textStyle({ dim: true })}>{" " + sug.desc}</span>
                )}
              </text>
            )
          })}
        </box>
      )}

      <text>
        <span style={textStyle({ fg: resolvedPromptColor })}>{prompt}</span>
        {value.length === 0 ? (
          <>
            {!disabled && <span style={textStyle({ fg: theme.muted })}>{CURSOR_CHAR}</span>}
            <span style={textStyle({ dim: true })}>{disabled ? disabledText : " " + placeholder}</span>
          </>
        ) : (
          <>
            {renderInputText(value, theme)}
            {!disabled && <span style={textStyle({ fg: theme.muted })}>{CURSOR_CHAR}</span>}
          </>
        )}
      </text>

      {showDividers && (
        <text wrapMode="none"><span style={textStyle({ dim: true, fg: theme.muted })}>{"─".repeat(500)}</span></text>
      )}
    </box>
  )
}

/** Highlights slash commands and @mentions inline */
function renderInputText(value: string, theme: { secondary: string; accent: string }) {
  const parts = value.split(/(@\S+|\/\S+)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("/")) {
          return <span key={i} style={textStyle({ fg: theme.secondary })}>{part}</span>
        }
        if (part.startsWith("@")) {
          return <span key={i} style={textStyle({ fg: theme.accent })}>{part}</span>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
