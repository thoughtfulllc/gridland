// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { useState, useRef, useCallback, useEffect, type ReactNode } from "react"
import {
  useFocus,
  FocusProvider,
  FocusScope,
  useKeyboard,
  useShortcuts,
  useFocusedShortcuts,
} from "@gridland/utils"
import { StatusBar } from "../status-bar/status-bar"
import { textStyle } from "../text-style"
import { useTheme } from "../theme/index"

// ── Types ─────────────────────────────────────────────────────────────

export interface SideNavItem {
  /** Unique identifier for this nav item. */
  id: string
  /** Display label shown in the sidebar. */
  name: string
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
   * Receives the active item, whether the user has selected it for interaction,
   * and a captureKeyboard callback for routing keyboard events.
   */
  children: (ctx: {
    activeItem: SideNavItem
    isInteracting: boolean
    captureKeyboard: (handler: (event: any) => void) => void
  }) => ReactNode
  /** Show the status bar at the bottom. @default true */
  showStatusBar?: boolean
  /**
   * Programmatically switch the active item by ID. When this changes to a new
   * value that matches an item in the list, the nav switches to that item.
   * User navigation via arrow keys always overrides this after it fires.
   */
  requestedActiveId?: string
}

// ── NavItem ───────────────────────────────────────────────────────────

function NavItemRow({ item, autoFocus, onFocus, onSelectChange, handlerRef }: {
  item: SideNavItem
  autoFocus?: boolean
  onFocus: () => void
  onSelectChange: (selected: boolean) => void
  handlerRef: React.MutableRefObject<((event: any) => void) | null>
}) {
  const theme = useTheme()
  const { isFocused, isSelected, isAnySelected, focusId, focusRef } = useFocus({ id: item.id, autoFocus })

  useEffect(() => {
    if (isFocused) onFocus()
  }, [isFocused])

  useEffect(() => {
    onSelectChange(isSelected)
  }, [isSelected])

  useKeyboard((event) => {
    handlerRef.current?.(event)
  }, { focusId, selectedOnly: true })

  useShortcuts(
    isSelected
      ? [{ key: "esc", label: "back" }]
      : [{ key: "↑↓", label: "navigate" }, { key: "enter", label: "select" }],
    focusId,
  )

  const fg = isSelected ? theme.focusSelected
    : isFocused ? theme.focusFocused
    : theme.muted
  const bg = isFocused && !isSelected && !isAnySelected ? theme.focusIdle : undefined

  return (
    <box ref={focusRef} height={1} paddingX={1}>
      <text style={textStyle({ fg, bg, bold: isFocused || isSelected })}>
        {isFocused || isSelected ? ">" : " "} {item.name}
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
  requestedActiveId,
}: SideNavProps) {
  const theme = useTheme()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isInteracting, setIsInteracting] = useState(false)
  const handlerRef = useRef<((event: any) => void) | null>(null)
  const lastRequestedActiveIdRef = useRef<string | undefined>()
  // Tracks which nav item triggered the interaction, decoupled from activeIndex.
  // Without this, changing activeIndex programmatically breaks the isInteracting
  // update when that original item deselects (e.g. on Esc).
  const interactingItemIdRef = useRef<string | null>(null)

  // Switch active item when requestedActiveId changes to a new value.
  // Uses a ref to avoid re-processing the same ID if items re-render.
  useEffect(() => {
    if (!requestedActiveId || requestedActiveId === lastRequestedActiveIdRef.current) return
    lastRequestedActiveIdRef.current = requestedActiveId
    const idx = items.findIndex(item => item.id === requestedActiveId)
    if (idx !== -1) setActiveIndex(idx)
  }, [requestedActiveId, items])

  const captureKeyboard = useCallback((handler: (event: any) => void) => {
    handlerRef.current = handler
  }, [])

  const activeItem = items[activeIndex]

  return (
    <FocusProvider selectable>
      <box flexDirection="row" flexGrow={1}>
        {/* Sidebar — full height with right divider */}
        <box flexDirection="column" width={sidebarWidth} border={["right"]} borderColor={theme.borderMuted}>
          {title && (
            <box paddingX={2} paddingTop={1}>
              <text style={textStyle({ bold: true, fg: theme.focusFocused })}>
                {title}
              </text>
            </box>
          )}
          <box flexDirection="column" paddingTop={1}>
            {items.map((item, i) => (
              <NavItemRow
                key={item.id}
                item={item}
                autoFocus={i === 0}
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
                handlerRef={handlerRef}
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
              <box paddingX={1}>
                <text style={textStyle({ bold: true, fg: theme.focusSelected })}>
                  {activeItem.name}
                </text>
              </box>
              {isInteracting ? (
                <FocusScope trap selectable autoFocus autoSelect restoreOnUnmount>
                  {children({ activeItem, isInteracting, captureKeyboard })}
                </FocusScope>
              ) : (
                children({ activeItem, isInteracting, captureKeyboard })
              )}
            </box>
          </box>
          {showStatusBar && <SideNavStatusBar />}
        </box>
      </box>
    </FocusProvider>
  )
}
