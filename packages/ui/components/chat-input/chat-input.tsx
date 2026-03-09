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
  useKeyboard,
}: ChatInputProps) {
  const theme = useTheme()
  const resolvedPromptColor = promptColor ?? theme.muted

  const [value, setValue] = useState("")
  const valueRef = useRef("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [sugIdx, setSugIdx] = useState(0)
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)

  const updateValue = (next: string) => {
    valueRef.current = next
    setValue(next)
    onChange?.(next)
    updateSuggestions(next)
  }

  const updateSuggestions = (input: string) => {
    if (customGetSuggestions) {
      const results = customGetSuggestions(input)
      setSuggestions(results)
      setSugIdx(0)
      return
    }

    if (input.startsWith("/") && commands.length > 0) {
      const matches = commands
        .filter((c) => c.cmd.startsWith(input))
        .map((c) => ({ text: c.cmd, desc: c.desc }))
      setSuggestions(matches)
      setSugIdx(0)
    } else if (input.includes("@") && files.length > 0) {
      const query = input.split("@").pop() ?? ""
      const matches = files
        .filter((f) => f.toLowerCase().includes(query.toLowerCase()))
        .map((f) => ({ text: "@" + f }))
      setSuggestions(matches)
      setSugIdx(0)
    } else {
      setSuggestions([])
    }
  }

  const submit = () => {
    const trimmed = valueRef.current.trim()
    if (!trimmed) return
    onSubmit?.(trimmed)
    if (enableHistory) {
      setHistory((prev) => [trimmed, ...prev])
    }
    updateValue("")
    setHistIdx(-1)
    setSuggestions([])
  }

  const acceptSuggestion = () => {
    const sel = suggestions[sugIdx]
    if (!sel) return
    if (valueRef.current.startsWith("/")) {
      updateValue(sel.text + " ")
    } else {
      const base = valueRef.current.slice(0, valueRef.current.lastIndexOf("@"))
      updateValue(base + sel.text + " ")
    }
    setSuggestions([])
  }

  useKeyboard?.((event: any) => {
    if (disabled) return

    if (event.name === "return") {
      if (suggestions.length > 0) {
        acceptSuggestion()
      } else {
        submit()
      }
      return
    }

    if (event.name === "tab" && suggestions.length > 0) {
      setSugIdx((i) => (i + 1) % suggestions.length)
      return
    }

    if (event.name === "up") {
      if (suggestions.length > 0) {
        setSugIdx((i) => Math.max(0, i - 1))
      } else if (enableHistory && history.length > 0) {
        const idx = Math.min(history.length - 1, histIdx + 1)
        setHistIdx(idx)
        updateValue(history[idx]!)
      }
      return
    }

    if (event.name === "down") {
      if (suggestions.length > 0) {
        setSugIdx((i) => Math.min(suggestions.length - 1, i + 1))
      } else if (enableHistory && histIdx > 0) {
        setHistIdx(histIdx - 1)
        updateValue(history[histIdx - 1]!)
      } else if (enableHistory && histIdx === 0) {
        setHistIdx(-1)
        updateValue("")
      }
      return
    }

    if (event.name === "escape") {
      if (suggestions.length > 0) {
        setSuggestions([])
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
      {/* Suggestions dropdown */}
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

      {/* Input line */}
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
