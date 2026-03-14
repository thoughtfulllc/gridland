import {
  useState,
  useRef,
  useCallback,
  useMemo,
  createContext,
  useContext,
  type ReactNode,
  type PropsWithChildren,
} from "react"
import { textStyle } from "./text-style"
import { useTheme } from "./theme"
import { useKeyboardContext } from "./provider"

/** Chat status matching Vercel AI SDK's useChat status pattern. */
export type ChatStatus = "ready" | "submitted" | "streaming" | "error"

export interface Suggestion {
  text: string
  desc?: string
}

/** Message shape passed to onSubmit — mirrors `sendMessage({ text })` from Vercel AI SDK. */
export interface PromptInputMessage {
  text: string
}

// ============================================================================
// Provider (lifted state — mirrors ai-element PromptInputProvider)
// ============================================================================

export interface TextInputContext {
  value: string
  setValue: (v: string) => void
  clear: () => void
}

export interface SuggestionsContext {
  suggestions: Suggestion[]
  selectedIndex: number
  setSuggestions: (s: Suggestion[]) => void
  setSelectedIndex: (i: number) => void
  clear: () => void
}

interface PromptInputControllerProps {
  textInput: TextInputContext
  suggestions: SuggestionsContext
}

const PromptInputControllerCtx = createContext<PromptInputControllerProps | null>(null)

/** Access lifted PromptInput state from outside the component. Requires `<PromptInputProvider>`. */
export function usePromptInputController(): PromptInputControllerProps {
  const ctx = useContext(PromptInputControllerCtx)
  if (!ctx) {
    throw new Error("Wrap your component inside <PromptInputProvider> to use usePromptInputController().")
  }
  return ctx
}

const useOptionalController = () => useContext(PromptInputControllerCtx)

export type PromptInputProviderProps = PropsWithChildren<{
  initialInput?: string
}>

/**
 * Optional provider that lifts PromptInput state outside of PromptInput.
 * Without it, PromptInput stays fully self-managed.
 */
export function PromptInputProvider({ initialInput = "", children }: PromptInputProviderProps) {
  const [value, setValueState] = useState(initialInput)
  const clearInput = useCallback(() => setValueState(""), [])

  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    setSelectedIndex(0)
  }, [])

  const controller = useMemo<PromptInputControllerProps>(
    () => ({
      textInput: { value, setValue: setValueState, clear: clearInput },
      suggestions: {
        suggestions,
        selectedIndex,
        setSuggestions,
        setSelectedIndex,
        clear: clearSuggestions,
      },
    }),
    [value, clearInput, suggestions, selectedIndex, clearSuggestions],
  )

  return (
    <PromptInputControllerCtx.Provider value={controller}>
      {children}
    </PromptInputControllerCtx.Provider>
  )
}

// ============================================================================
// Component Context (rendering state for subcomponents)
// ============================================================================

export interface PromptInputContextValue {
  value: string
  disabled: boolean
  status?: ChatStatus
  onStop?: () => void
  statusHintText: string
  placeholder: string
  prompt: string
  promptColor: string
  suggestions: Suggestion[]
  sugIdx: number
  maxSuggestions: number
  errorText: string
  theme: ReturnType<typeof useTheme>
}

const PromptInputContext = createContext<PromptInputContextValue | null>(null)

/** Hook for accessing PromptInput state from compound subcomponents. */
export function usePromptInput(): PromptInputContextValue {
  const ctx = useContext(PromptInputContext)
  if (!ctx) {
    throw new Error("usePromptInput must be used within a <PromptInput> component")
  }
  return ctx
}

// ============================================================================
// Props
// ============================================================================

export interface PromptInputProps {
  /** Controlled input value */
  value?: string
  /** Default value for uncontrolled mode */
  defaultValue?: string
  /**
   * Called when user submits a message.
   * Receives `{ text }` to match Vercel AI SDK's `sendMessage({ text })`.
   * If the handler returns a Promise, input is cleared on resolve and
   * preserved on reject so the user can retry.
   */
  onSubmit?: (message: PromptInputMessage) => void | Promise<void>
  /** Callback when input value changes */
  onChange?: (text: string) => void
  /** Placeholder text when input is empty */
  placeholder?: string
  /** Prompt character shown before input */
  prompt?: string
  /** Color of the prompt character */
  promptColor?: string
  /**
   * AI chat status — drives disabled state and status indicator.
   * When provided, takes precedence over `disabled`/`disabledText`.
   */
  status?: ChatStatus
  /** Called when user presses Escape during streaming to stop generation */
  onStop?: () => void
  /** Text shown when status is "submitted" */
  submittedText?: string
  /** Text shown when status is "streaming" */
  streamingText?: string
  /** Text shown when status is "error" */
  errorText?: string
  /** Disable input. Ignored when `status` is provided. */
  disabled?: boolean
  /** Text shown when disabled. Ignored when `status` is provided. */
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
  /** Compound mode: provide subcomponents as children */
  children?: ReactNode
}

// ============================================================================
// Helpers
// ============================================================================

function computeDefaultSuggestions(
  input: string,
  commands: { cmd: string; desc?: string }[],
  files: string[],
): Suggestion[] {
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

function resolveStatusHintText(
  status: ChatStatus | undefined,
  submittedText: string,
  streamingText: string,
  errorText: string,
  disabledText: string,
): string {
  if (status === "submitted") return submittedText
  if (status === "streaming") return streamingText
  if (status === "error") return errorText
  return disabledText
}

// ============================================================================
// Subcomponents
// ============================================================================

/** Horizontal divider line. */
function PromptInputDivider() {
  const { theme } = usePromptInput()
  return (
    <text wrapMode="none">
      <span style={textStyle({ dim: true, fg: theme.muted })}>{"─".repeat(500)}</span>
    </text>
  )
}

/** Autocomplete suggestion list. */
function PromptInputSuggestions() {
  const { suggestions, sugIdx, maxSuggestions, theme } = usePromptInput()
  const visible = suggestions.slice(0, maxSuggestions)
  if (visible.length === 0) return null
  return (
    <box flexDirection="column" marginLeft={2}>
      {visible.map((sug, i) => {
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
              <span style={textStyle({ dim: true, fg: theme.placeholder })}>{" " + sug.desc}</span>
            )}
          </text>
        )
      })}
    </box>
  )
}

const CURSOR_CHAR = "\u258D"

/** Prompt char + text with syntax highlighting + cursor. */
function PromptInputTextarea() {
  const { value, disabled, statusHintText, placeholder, prompt, promptColor, theme } = usePromptInput()
  return (
    <text>
      <span style={textStyle({ fg: promptColor })}>{prompt}</span>
      {value.length === 0 ? (
        <>
          {!disabled && <span style={textStyle({ fg: theme.muted })}>{CURSOR_CHAR}</span>}
          <span style={textStyle({ dim: true, fg: theme.placeholder })}>{disabled ? statusHintText : " " + placeholder}</span>
        </>
      ) : (
        <>
          <span style={textStyle({ fg: theme.foreground })}>{value}</span>
          {!disabled && <span style={textStyle({ fg: theme.muted })}>{CURSOR_CHAR}</span>}
        </>
      )}
    </text>
  )
}

/**
 * Status indicator: ⏎ ready, ◐ submitted, ■ streaming, ✕ error.
 * When `status` and `onStop` are provided via context, the streaming icon
 * doubles as a stop button (Escape triggers onStop).
 */
function PromptInputSubmit(props: { status?: ChatStatus; onStop?: () => void }) {
  const ctx = usePromptInput()
  const status = props.status ?? ctx.status
  const onStop = props.onStop ?? ctx.onStop
  const { disabled, theme } = ctx

  const isGenerating = status === "submitted" || status === "streaming"

  const icon =
    status === "submitted" ? "◐"
    : status === "streaming" ? (onStop ? "■" : "◐")
    : status === "error" ? "✕"
    : "⏎"

  const color =
    status === "error" ? theme.error
    : isGenerating ? theme.muted
    : disabled ? theme.muted
    : theme.primary

  return (
    <text>
      <span style={textStyle({ fg: color })}>{" " + icon}</span>
    </text>
  )
}

/** Error/hint text below input. */
function PromptInputStatusText() {
  const { status, errorText, theme } = usePromptInput()
  if (status !== "error") return null
  return (
    <text>
      <span style={textStyle({ fg: theme.error })}>{errorText}</span>
    </text>
  )
}

// ============================================================================
// Root component
// ============================================================================

export function PromptInput({
  value: controlledValue,
  defaultValue = "",
  onSubmit,
  onChange,
  placeholder = "Type a message...",
  prompt = "❯ ",
  promptColor,
  status,
  onStop,
  submittedText = "Thinking...",
  streamingText: streamingLabel = "Generating...",
  errorText = "An error occurred. Try again.",
  disabled: disabledProp = false,
  disabledText = "Generating...",
  commands = [],
  files = [],
  getSuggestions: customGetSuggestions,
  maxSuggestions = 5,
  enableHistory = true,
  showDividers = false,
  useKeyboard: useKeyboardProp,
  children,
}: PromptInputProps) {
  const theme = useTheme()
  const useKeyboard = useKeyboardContext(useKeyboardProp)
  const resolvedPromptColor = promptColor ?? theme.muted

  // Status-driven state
  const disabled = status ? status === "submitted" || status === "streaming" : disabledProp
  const statusHintText = resolveStatusHintText(status, submittedText, streamingLabel, errorText, disabledText)

  // ── Dual-mode state: provider-managed or self-managed ──────────────────
  const controller = useOptionalController()
  const usingProvider = !!controller

  const isControlled = controlledValue !== undefined
  const controlledRef = useRef(isControlled)
  if (controlledRef.current !== isControlled) {
    console.warn("PromptInput: switching between controlled and uncontrolled is not supported.")
  }

  // Local state (used when no provider and not controlled)
  const [localValue, setLocalValue] = useState(defaultValue)
  const [localSuggestions, setLocalSuggestions] = useState<Suggestion[]>([])
  const [localSugIdx, setLocalSugIdx] = useState(0)
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)

  // Resolve value from: controlled prop > provider > local
  const value = isControlled
    ? controlledValue
    : usingProvider
      ? controller.textInput.value
      : localValue

  const suggestions = usingProvider ? controller.suggestions.suggestions : localSuggestions
  const sugIdx = usingProvider ? controller.suggestions.selectedIndex : localSugIdx

  // ── State updaters (unified across modes) ──────────────────────────────

  const valueRef = useRef(defaultValue)
  if (isControlled) valueRef.current = controlledValue
  else if (usingProvider) valueRef.current = controller.textInput.value
  else valueRef.current = localValue

  const suggestionsRef = useRef<Suggestion[]>([])
  suggestionsRef.current = suggestions
  const sugIdxRef = useRef(0)
  sugIdxRef.current = sugIdx
  const historyRef = useRef<string[]>([])
  historyRef.current = history
  const histIdxRef = useRef(-1)
  histIdxRef.current = histIdx

  const setSug = useCallback((next: Suggestion[]) => {
    suggestionsRef.current = next
    if (usingProvider) {
      controller.suggestions.setSuggestions(next)
    } else {
      setLocalSuggestions(next)
    }
  }, [usingProvider, controller])

  const setSugI = useCallback((next: number) => {
    sugIdxRef.current = next
    if (usingProvider) {
      controller.suggestions.setSelectedIndex(next)
    } else {
      setLocalSugIdx(next)
    }
  }, [usingProvider, controller])

  const setHist = useCallback((next: string[]) => {
    historyRef.current = next
    setHistory(next)
  }, [])

  const setHistI = useCallback((next: number) => {
    histIdxRef.current = next
    setHistIdx(next)
  }, [])

  const computeSuggestions = useCallback((input: string): Suggestion[] => {
    if (customGetSuggestions) return customGetSuggestions(input)
    return computeDefaultSuggestions(input, commands, files)
  }, [customGetSuggestions, commands, files])

  const updateValue = useCallback((next: string) => {
    valueRef.current = next
    if (isControlled) {
      // controlled: only fire onChange, parent owns state
    } else if (usingProvider) {
      controller.textInput.setValue(next)
    } else {
      setLocalValue(next)
    }
    onChange?.(next)
    const sug = computeSuggestions(next)
    setSug(sug)
    setSugI(0)
  }, [isControlled, usingProvider, controller, onChange, computeSuggestions, setSug, setSugI])

  // ── Submit handler (auto-clears on success, preserves on error) ────────

  const clearInput = useCallback(() => {
    if (usingProvider) {
      controller.textInput.clear()
    } else if (!isControlled) {
      setLocalValue("")
    }
    onChange?.("")
  }, [usingProvider, controller, isControlled, onChange])

  const handleSubmit = useCallback((text: string) => {
    if (!onSubmit) return

    const result = onSubmit({ text })

    // Handle async onSubmit: clear on resolve, preserve on reject
    if (result instanceof Promise) {
      result.then(
        () => clearInput(),
        () => { /* Don't clear on error — user may want to retry */ },
      )
    } else {
      // Sync onSubmit completed without throwing — clear
      clearInput()
    }
  }, [onSubmit, clearInput])

  // ── Keyboard handler ───────────────────────────────────────────────────

  useKeyboard?.((event: any) => {
    // Escape during submitted/streaming calls onStop
    if (event.name === "escape" && (status === "streaming" || status === "submitted") && onStop) {
      onStop()
      return
    }

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
            handleSubmit(sel.text)
          } else {
            const base = valueRef.current.slice(0, valueRef.current.lastIndexOf("@"))
            updateValue(base + sel.text + " ")
            setSug([])
          }
        }
      } else {
        const trimmed = valueRef.current.trim()
        if (!trimmed) return
        if (enableHistory) {
          setHist([trimmed, ...historyRef.current])
        }
        updateValue("")
        setHistI(-1)
        setSug([])
        handleSubmit(trimmed)
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

    // Character-level input fallback (used when <input> intrinsic is not available, e.g. in tests)
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

  // ── Build context for subcomponents ────────────────────────────────────

  const visibleSuggestions = suggestions.slice(0, maxSuggestions)

  const ctxValue: PromptInputContextValue = {
    value,
    disabled,
    status,
    onStop,
    statusHintText,
    placeholder,
    prompt,
    promptColor: resolvedPromptColor,
    suggestions: visibleSuggestions,
    sugIdx,
    maxSuggestions,
    errorText,
    theme,
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (children) {
    return (
      <PromptInputContext.Provider value={ctxValue}>
        <box flexDirection="column">
          {children}
        </box>
      </PromptInputContext.Provider>
    )
  }

  return (
    <PromptInputContext.Provider value={ctxValue}>
      <box flexDirection="column">
        {showDividers && <PromptInputDivider />}
        <PromptInputSuggestions />
        <PromptInputTextarea />
        <PromptInputStatusText />
        {showDividers && <PromptInputDivider />}
      </box>
    </PromptInputContext.Provider>
  )
}

// ── Attach subcomponents ─────────────────────────────────────────────────

PromptInput.Textarea = PromptInputTextarea
PromptInput.Suggestions = PromptInputSuggestions
PromptInput.Submit = PromptInputSubmit
PromptInput.Divider = PromptInputDivider
PromptInput.StatusText = PromptInputStatusText
