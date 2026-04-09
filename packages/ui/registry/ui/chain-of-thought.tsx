import { createContext, memo, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { textStyle } from "./text-style"
import { useTheme } from "./theme"
import type { Theme } from "./theme"

// ── Constants ──────────────────────────────────────────────────────

const DOTS = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const
const SPINNER_INTERVAL = 80

// ── Step data type (for data-driven usage) ─────────────────────────

export interface ChainOfThoughtStepData {
  /** Primary label for the step. */
  label: string
  /** Secondary detail shown dimmed after the label. */
  description?: string
  /** Current status. */
  status: "done" | "running" | "pending" | "error"
  /** Custom icon character. */
  icon?: string
  /** Output text shown below the step. */
  output?: string
}

/** @deprecated Use ChainOfThoughtStepData instead. */
export type Step = ChainOfThoughtStepData

// ── Controllable state helper ──────────────────────────────────────

function useControllableOpen(
  controlledOpen: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange: ((open: boolean) => void) | undefined,
): [boolean, (open: boolean) => void] {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = controlledOpen ?? internalOpen
  const setOpen = useCallback((value: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(value)
    onOpenChange?.(value)
  }, [controlledOpen, onOpenChange])
  return [isOpen, setOpen]
}

// ── Context ────────────────────────────────────────────────────────

interface ChainOfThoughtContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const ChainOfThoughtContext = createContext<ChainOfThoughtContextValue | null>(null)

export const useChainOfThought = () => {
  const context = useContext(ChainOfThoughtContext)
  if (!context) {
    throw new Error("ChainOfThought components must be used within <ChainOfThought>")
  }
  return context
}

// ── Status helper ──────────────────────────────────────────────────

function getStepColor(status: string, theme: Theme): string {
  switch (status) {
    case "done": return theme.success
    case "running": return theme.primary
    case "pending": return theme.muted
    case "error": return theme.error
    default: return theme.muted
  }
}

// ── ChainOfThought (root) ──────────────────────────────────────────

export interface ChainOfThoughtProps {
  /** Controlled open state. */
  open?: boolean
  /** Default open state (uncontrolled). Defaults to false. */
  defaultOpen?: boolean
  /** Called when the open state changes. */
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

/** Collapsible chain-of-thought container with controlled or uncontrolled open state. */
export const ChainOfThought = memo(({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: ChainOfThoughtProps) => {
  const [isOpen, setIsOpen] = useControllableOpen(open, defaultOpen, onOpenChange)

  const context = useMemo(
    () => ({ isOpen, setIsOpen }),
    [isOpen, setIsOpen],
  )

  return (
    <ChainOfThoughtContext.Provider value={context}>
      <box flexDirection="column">
        {children}
      </box>
    </ChainOfThoughtContext.Provider>
  )
})

// ── ChainOfThoughtHeader ───────────────────────────────────────────

export interface ChainOfThoughtHeaderProps {
  /** Duration string shown after the label (e.g. "3.2s"). */
  duration?: string
  /** Header label content. Defaults to "Thought for". */
  children?: ReactNode
}

/** Header row with collapse arrow and optional duration label. */
export const ChainOfThoughtHeader = memo(({
  duration,
  children = "Thought for",
}: ChainOfThoughtHeaderProps) => {
  const theme = useTheme()
  const { isOpen } = useChainOfThought()
  const arrow = isOpen ? "▼" : "▶"

  return (
    <text>
      <span style={textStyle({ fg: theme.muted })}>{arrow}</span>
      <span style={textStyle({ dim: true, fg: theme.muted })}>{" "}{children}{duration ? " " + duration : ""}</span>
    </text>
  )
})

// ── ChainOfThoughtContent ──────────────────────────────────────────

export interface ChainOfThoughtContentProps {
  children: ReactNode
}

/** Content region that renders only when the chain is open. */
export const ChainOfThoughtContent = memo(({ children }: ChainOfThoughtContentProps) => {
  const { isOpen } = useChainOfThought()
  if (!isOpen) return null
  return <>{children}</>
})

// ── ChainOfThoughtStep ─────────────────────────────────────────────

export interface ChainOfThoughtStepProps {
  /** Primary label for the step. */
  label: string
  /** Secondary detail shown dimmed after the label. */
  description?: string
  /** Current status. Defaults to "done". */
  status?: "done" | "running" | "pending" | "error"
  /** Custom icon character. Defaults to status-based dot (● done, ○ pending, animated running). */
  icon?: string
  /** @deprecated Will be auto-detected in a future version. Safe to continue using. */
  isLast?: boolean
  /** Output content rendered below the step with a pipe gutter. */
  children?: ReactNode
}

/** Individual step with status icon, label, and optional output content. */
export const ChainOfThoughtStep = memo(({
  label,
  description,
  status = "done",
  icon,
  isLast = false,
  children,
}: ChainOfThoughtStepProps) => {
  const theme = useTheme()
  const isActive = status === "running"
  const isPending = status === "pending"
  const color = getStepColor(status, theme)
  const pipe = "│"

  // Self-contained spinner animation — only ticks when this step is active
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    if (!isActive) { setFrame(0); return }
    const id = setInterval(() => setFrame(f => f + 1), SPINNER_INTERVAL)
    return () => clearInterval(id)
  }, [isActive])

  const dot = icon ?? (isActive
    ? DOTS[frame % DOTS.length]!
    : isPending ? "○" : "●")

  return (
    <box flexDirection="column" marginLeft={1}>
      <text>
        <span style={textStyle({ fg: color })}>{dot}</span>
        <span style={textStyle({ fg: theme.foreground })}>{" "}</span>
        <span style={textStyle({ fg: isPending ? theme.muted : color, dim: isPending, bold: isActive })}>{label}</span>
        {description && <span style={textStyle({ dim: true, fg: theme.muted })}>{" — " + description}</span>}
      </text>
      {children && (
        <text>
          <span style={textStyle({ fg: color, dim: true })}>{pipe + "  "}</span>
          <span style={textStyle({ fg: status === "error" ? theme.error : theme.accent })}>{children}</span>
        </text>
      )}
      {!isLast && (
        <text>
          <span style={textStyle({ fg: color, dim: true })}>{pipe}</span>
        </text>
      )}
    </box>
  )
})

// ── Display names ──────────────────────────────────────────────────

ChainOfThought.displayName = "ChainOfThought"
ChainOfThoughtHeader.displayName = "ChainOfThoughtHeader"
ChainOfThoughtContent.displayName = "ChainOfThoughtContent"
ChainOfThoughtStep.displayName = "ChainOfThoughtStep"
