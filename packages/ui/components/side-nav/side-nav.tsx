import { useState, useRef, useEffect, type ReactNode } from "react"
import {
  FocusProvider,
  FocusScope,
  useFocus,
  useShortcuts,
  useFocusedShortcuts,
} from "@gridland/utils"
import { StatusBar } from "@/registry/gridland/ui/status-bar/status-bar"
import { textStyle } from "@/registry/gridland/lib/text-style"
import { useTheme } from "@/registry/gridland/lib/theme"

// ── Types ─────────────────────────────────────────────────────────────

export interface SideNavItem {
  /** Unique identifier for this nav item. */
  id: string
  /** Display label shown in the sidebar. */
  name: string
  /** Optional text appended after the item name. */
  suffix?: string
}

export interface SideNavProps {
  /** List of navigable items. */
  items: SideNavItem[]
  /** Width of the sidebar in columns. @default 20 */
  sidebarWidth?: number
  /** Optional title displayed above the sidebar. */
  title?: string
  /**
   * Render the main panel content for the active item.
   * Receives the active item and whether the user has selected it for
   * interaction. Panel content should use its own focusable components
   * (SelectInput with focusId, etc.) — the FocusScope trap inside SideNav
   * handles scope containment automatically when isInteracting=true.
   */
  children: (ctx: {
    activeItem: SideNavItem
    isInteracting: boolean
  }) => ReactNode
  /** Show the status bar at the bottom. @default true */
  showStatusBar?: boolean
  /** Show the active item name as a header in the main panel. @default true */
  showHeader?: boolean
  /**
   * Programmatically switch the active item by ID. When this changes to a new
   * value that matches an item in the list, the nav switches to that item.
   * User navigation via arrow keys always overrides this after it fires.
   */
  requestedActiveId?: string
  /** Called when the active item changes, whether by keyboard navigation or `requestedActiveId`. */
  onActiveItemChange?: (item: SideNavItem) => void
}

// ── NavItem ───────────────────────────────────────────────────────────

function NavItemRow({ item, autoFocus, onFocus, onSelectChange }: {
  item: SideNavItem
  autoFocus?: boolean
  onFocus: () => void
  onSelectChange: (selected: boolean) => void
}) {
  const theme = useTheme()
  const { isFocused, isSelected, focusId, focusRef } = useFocus({ id: item.id, autoFocus })

  const onFocusRef = useRef(onFocus)
  onFocusRef.current = onFocus
  const onSelectChangeRef = useRef(onSelectChange)
  onSelectChangeRef.current = onSelectChange

  useEffect(() => {
    if (isFocused) onFocusRef.current()
  }, [isFocused])

  useEffect(() => {
    onSelectChangeRef.current(isSelected)
  }, [isSelected])

  useShortcuts(
    isSelected
      ? [{ key: "esc", label: "back" }]
      : [{ key: "↑↓", label: "navigate" }, { key: "enter", label: "select" }],
    focusId,
  )

  const fg = isSelected ? theme.focusSelected
    : isFocused ? theme.focusFocused
    : theme.muted

  return (
    <box ref={focusRef} height={1} paddingX={1}>
      <text style={textStyle({ fg, bold: isFocused || isSelected })}>
        {isFocused || isSelected ? "▸" : " "} {item.name}{item.suffix && ` ${item.suffix}`}
      </text>
    </box>
  )
}

// ── SideNavStatusBar ──────────────────────────────────────────────────

function SideNavStatusBar() {
  const shortcuts = useFocusedShortcuts()
  return (
    <box paddingX={1} paddingBottom={1}>
      <StatusBar items={shortcuts} />
    </box>
  )
}

// ── SideNav ───────────────────────────────────────────────────────────

/** Two-panel layout with a keyboard-navigable sidebar and a main content area. */
export function SideNav({
  items,
  sidebarWidth = 20,
  title,
  children,
  showStatusBar = true,
  showHeader = true,
  requestedActiveId,
  onActiveItemChange,
}: SideNavProps) {
  const theme = useTheme()
  const initialIndex = requestedActiveId
    ? Math.max(0, items.findIndex(i => i.id === requestedActiveId))
    : 0
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [isInteracting, setIsInteracting] = useState(false)
  const lastRequestedActiveIdRef = useRef<string | undefined>(requestedActiveId)
  // Tracks which nav item triggered the interaction, decoupled from activeIndex.
  // Without this, changing activeIndex programmatically breaks the isInteracting
  // update when that original item deselects (e.g. on Esc).
  const interactingItemIdRef = useRef<string | null>(null)

  // Clamp activeIndex when items shrink to prevent out-of-bounds access.
  useEffect(() => {
    if (activeIndex >= items.length && items.length > 0) {
      setActiveIndex(items.length - 1)
    }
  }, [activeIndex, items.length])

  // Switch active item when requestedActiveId changes to a new value.
  // Uses a ref to avoid re-processing the same ID if items re-render.
  useEffect(() => {
    if (!requestedActiveId || requestedActiveId === lastRequestedActiveIdRef.current) return
    lastRequestedActiveIdRef.current = requestedActiveId
    const idx = items.findIndex(item => item.id === requestedActiveId)
    if (idx !== -1) setActiveIndex(idx)
  }, [requestedActiveId, items])

  const clampedIndex = Math.min(activeIndex, Math.max(0, items.length - 1))
  const activeItem = items[clampedIndex]

  const prevActiveIdRef = useRef(activeItem?.id)
  useEffect(() => {
    if (activeItem && activeItem.id !== prevActiveIdRef.current) {
      prevActiveIdRef.current = activeItem.id
      onActiveItemChange?.(activeItem)
    }
  }, [activeItem?.id])

  if (!activeItem) return null

  return (
    <FocusProvider selectable>
      <box flexDirection="row" flexGrow={1}>
        {/* Sidebar — full height with right divider */}
        <box flexDirection="column" width={sidebarWidth} border={["right"]} borderColor={theme.borderMuted}>
          {title && (
            <box paddingX={2} paddingTop={1}>
              <text style={textStyle({ bold: true, fg: theme.primary })}>
                {title}
              </text>
            </box>
          )}
          <box flexDirection="column" paddingTop={1}>
            {items.map((item, i) => (
              <NavItemRow
                key={item.id}
                item={item}
                autoFocus={i === initialIndex}
                onFocus={() => setActiveIndex(i)}
                onSelectChange={(selected) => {
                  if (selected) {
                    interactingItemIdRef.current = item.id
                    setIsInteracting(true)
                  } else if (interactingItemIdRef.current === item.id) {
                    interactingItemIdRef.current = null
                    setIsInteracting(false)
                  }
                }}
              />
            ))}
          </box>
        </box>

        {/* Main panel */}
        <box flexDirection="column" flexGrow={1}>
          <box flexDirection="column" flexGrow={1} paddingTop={1} overflow="hidden">
            <box
              flexDirection="column"
              flexGrow={1}
              overflow="hidden"
            >
              {showHeader && (
                <box paddingX={1}>
                  <text style={textStyle({ bold: true, fg: theme.primary })}>
                    {activeItem.name}
                  </text>
                </box>
              )}
              {isInteracting ? (
                <FocusScope trap selectable autoFocus autoSelect restoreOnUnmount>
                  {children({ activeItem, isInteracting })}
                </FocusScope>
              ) : (
                children({ activeItem, isInteracting })
              )}
            </box>
          </box>
          {showStatusBar && <SideNavStatusBar />}
        </box>
      </box>
    </FocusProvider>
  )
}
