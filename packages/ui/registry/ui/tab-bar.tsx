import { createContext, useContext, useState, useCallback, useRef, Children, isValidElement } from "react"
import type { ReactNode } from "react"
import { textStyle } from "./text-style"
import { useTheme } from "./theme"
import { useKeyboardContext } from "./provider"

// ── Context ──────────────────────────────────────────────────────────────

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error("Tabs compound components must be used within <Tabs>")
  return ctx
}

// ── Tabs (root) ──────────────────────────────────────────────────────────

export interface TabsProps {
  /** The controlled active tab value. */
  value?: string
  /** The default active tab value (uncontrolled). */
  defaultValue?: string
  /** Called when the active tab changes. */
  onValueChange?: (value: string) => void
  children: ReactNode
}

/** Root compound component for tabbed navigation. Manages active tab state. */
export function Tabs({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  children,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const isControlled = controlledValue !== undefined
  const controlledRef = useRef(isControlled)
  if (controlledRef.current !== isControlled) {
    console.warn("Tabs: switching between controlled and uncontrolled is not supported.")
  }
  const value = controlledValue ?? internalValue
  const handleChange = useCallback((newValue: string) => {
    if (controlledValue === undefined) setInternalValue(newValue)
    onValueChange?.(newValue)
  }, [controlledValue, onValueChange])

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleChange }}>
      <box flexDirection="column">{children}</box>
    </TabsContext.Provider>
  )
}

// ── TabsList ─────────────────────────────────────────────────────────────

export interface TabsListProps {
  /** Optional label shown before the tab triggers. */
  label?: string
  /** Whether the tab bar appears focused. */
  focused?: boolean
  /** The foreground color applied to the active trigger. */
  activeColor?: string
  /** Whether to show the horizontal separator below the triggers. */
  separator?: boolean
  /** Keyboard handler — pass useKeyboard from @gridland/utils */
  useKeyboard?: (handler: (event: any) => void) => void
  children: ReactNode
}

/** Renders the tab trigger row with keyboard navigation and optional separator. */
export function TabsList({
  label,
  focused = true,
  activeColor,
  separator = true,
  useKeyboard: useKeyboardProp,
  children,
}: TabsListProps) {
  const theme = useTheme()
  const { value, onValueChange } = useTabsContext()
  const useKeyboard = useKeyboardContext(useKeyboardProp)
  const color = activeColor ?? theme.accent

  // Extract trigger values, labels, and disabled state from children
  const triggers: { value: string; label: ReactNode; disabled: boolean }[] = []
  Children.forEach(children, (child) => {
    if (isValidElement<TabsTriggerProps>(child) && "value" in child.props) {
      triggers.push({ value: child.props.value as string, label: child.props.children, disabled: !!child.props.disabled })
    }
  })

  // Refs for stable access inside keyboard handler
  const triggersRef = useRef(triggers)
  triggersRef.current = triggers
  const valueRef = useRef(value)
  valueRef.current = value

  // Keyboard navigation: left/right arrows switch tabs
  useKeyboard?.((event: any) => {
    const t = triggersRef.current
    if (t.length === 0) return
    const currentIndex = t.findIndex((x) => x.value === valueRef.current)

    const findNextEnabled = (from: number, direction: 1 | -1): number => {
      let next = from
      for (let i = 0; i < t.length; i++) {
        next += direction
        if (next < 0) next = t.length - 1
        if (next >= t.length) next = 0
        if (!t[next].disabled) return next
      }
      return from // all disabled
    }

    if (event.name === "left" || event.name === "h") {
      const next = findNextEnabled(currentIndex, -1)
      onValueChange(t[next].value)
      event.preventDefault?.()
    } else if (event.name === "right" || event.name === "l") {
      const next = findNextEnabled(currentIndex, 1)
      onValueChange(t[next].value)
      event.preventDefault?.()
    }
  })

  const parts: any[] = []

  if (label !== undefined) {
    parts.push(
      <span
        key="label"
        style={focused ? textStyle({ bold: true, fg: theme.foreground }) : textStyle({ dim: true, fg: theme.muted })}
      >
        {label}{" "}
      </span>,
    )
  }

  triggers.forEach((trigger, i) => {
    const isSelected = trigger.value === value
    const padded = ` ${trigger.label} `

    const style = trigger.disabled
      ? textStyle({ dim: true, fg: theme.muted })
      : isSelected
        ? focused
          ? textStyle({ bold: true, fg: theme.background, bg: color })
          : textStyle({ bold: true, fg: theme.background, bg: theme.muted, dim: true })
        : focused
          ? textStyle({ fg: theme.foreground })
          : textStyle({ dim: true, fg: theme.muted })

    if (i > 0) {
      parts.push(
        <span key={`div-${i}`} style={textStyle({ dim: true, fg: theme.muted })}>│</span>,
      )
    }

    parts.push(
      <span key={`opt-${i}`} style={style}>
        {padded}
      </span>,
    )
  })

  return (
    <box flexDirection="column">
      <text>{parts}</text>
      {separator && (
        <text wrapMode="none" style={textStyle({ dim: true, fg: theme.muted })}>
          {"─".repeat(200)}
        </text>
      )}
    </box>
  )
}

// ── TabsTrigger ──────────────────────────────────────────────────────────

export interface TabsTriggerProps {
  /** Unique value that links this trigger to its TabsContent. */
  value: string
  /** Whether this tab trigger is disabled. Disabled tabs are skipped during keyboard navigation. */
  disabled?: boolean
  children: ReactNode
}

/**
 * Declares a tab trigger. Does not render anything itself —
 * TabsList reads the value and children props to build the tab bar.
 */
export function TabsTrigger(_props: TabsTriggerProps) {
  return null
}

// ── TabsContent ──────────────────────────────────────────────────────────

export interface TabsContentProps {
  /** The value that must match the active tab for this content to render. */
  value: string
  children: ReactNode
}

/** Renders children only when its value matches the active tab. */
export function TabsContent({ value, children }: TabsContentProps) {
  const { value: activeValue } = useTabsContext()
  if (activeValue !== value) return null
  return <>{children}</>
}

// ── Legacy TabBar (simple API) ───────────────────────────────────────────

export interface TabBarProps {
  /** Text label shown before the options. */
  label?: string
  /** Array of option strings to display. */
  options: string[]
  /** Zero-based index of the currently selected option. */
  selectedIndex: number
  /** Called when the active tab changes via keyboard navigation. Receives the new zero-based index. */
  onValueChange?: (index: number) => void
  /** Whether the tab bar appears focused. */
  focused?: boolean
  /** The foreground color applied to the selected option when focused. */
  activeColor?: string
  /** Whether to show the horizontal separator below tabs. */
  separator?: boolean
  /** Keyboard handler — pass useKeyboard from @gridland/utils */
  useKeyboard?: (handler: (event: any) => void) => void
}

/** Simple tab bar API wrapping the compound Tabs components. */
export function TabBar({
  label,
  options,
  selectedIndex,
  onValueChange,
  focused = true,
  activeColor,
  separator = true,
  useKeyboard,
}: TabBarProps) {
  return (
    <Tabs value={String(selectedIndex)} onValueChange={(v) => onValueChange?.(Number(v))}>
      <TabsList label={label} focused={focused} activeColor={activeColor} separator={separator} useKeyboard={useKeyboard}>
        {options.map((option, i) => (
          <TabsTrigger key={i} value={String(i)}>
            {option}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
