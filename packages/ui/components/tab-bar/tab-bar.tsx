import { createContext, useContext, useState, Children, isValidElement } from "react"
import type { ReactNode } from "react"
import { textStyle } from "../text-style"
import { useTheme } from "../theme/index"

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

export function Tabs({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  children,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const value = controlledValue ?? internalValue
  const handleChange = onValueChange ?? setInternalValue

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
  children: ReactNode
}

export function TabsList({
  label,
  focused = true,
  activeColor,
  separator = true,
  children,
}: TabsListProps) {
  const theme = useTheme()
  const { value } = useTabsContext()
  const color = activeColor ?? theme.accent

  // Extract trigger values and labels from children
  const triggers: { value: string; label: ReactNode }[] = []
  Children.forEach(children, (child) => {
    if (isValidElement(child) && "value" in child.props) {
      triggers.push({ value: child.props.value as string, label: child.props.children })
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

    const style = isSelected
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
  /** Whether the tab bar appears focused. */
  focused?: boolean
  /** The foreground color applied to the selected option when focused. */
  activeColor?: string
  /** Whether to show the horizontal separator below tabs. */
  separator?: boolean
}

export function TabBar({
  label,
  options,
  selectedIndex,
  focused = true,
  activeColor,
  separator = true,
}: TabBarProps) {
  return (
    <Tabs value={options[selectedIndex]}>
      <TabsList label={label} focused={focused} activeColor={activeColor} separator={separator}>
        {options.map((option) => (
          <TabsTrigger key={option} value={option}>
            {option}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
