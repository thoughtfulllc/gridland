// @ts-nocheck
"use client"
import { useFocus, FocusProvider, useShortcuts, useFocusedShortcuts } from "@gridland/utils"
import { StatusBar, useFocusBorderStyle, useTheme } from "@gridland/ui"

const gridItems = [
  { id: "cell-1" },
  { id: "cell-2" },
  { id: "cell-3" },
  { id: "cell-4" },
  { id: "cell-5" },
  { id: "cell-6" },
]

function GridCell({ id, autoFocus }: {
  id: string; autoFocus?: boolean
}) {
  const { isFocused, isSelected, isAnySelected, focusId, focusRef } = useFocus({ id, autoFocus })

  useShortcuts(
    isSelected
      ? [{ key: "esc", label: "back" }]
      : [{ key: "↑↓←→", label: "navigate" }, { key: "enter", label: "select" }, { key: "tab", label: "cycle" }],
    focusId,
  )

  const theme = useTheme()
  const { borderColor, borderStyle } = useFocusBorderStyle({ isFocused, isSelected, isAnySelected })
  const fg = isSelected ? theme.focusSelected
    : isFocused ? theme.focusSelected
    : theme.muted

  return (
    <box ref={focusRef} border borderStyle={borderStyle} borderColor={borderColor} width={16} height={5}>
      <box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <text style={{ fg, bold: isFocused || isSelected }}>
          {isSelected ? "selected" : "not selected"}
        </text>
      </box>
    </box>
  )
}

function FocusGridStatusBar() {
  const shortcuts = useFocusedShortcuts()
  return (
    <box paddingX={1} paddingBottom={1}>
      <StatusBar items={shortcuts} />
    </box>
  )
}

export function FocusGridApp() {
  return (
    <FocusProvider selectable>
      <box flexDirection="column" flexGrow={1}>
        <box flexDirection="column" gap={1} padding={1} flexGrow={1} alignItems="center">
          <box flexDirection="row" gap={1}>
            {gridItems.slice(0, 3).map((item, i) => (
              <GridCell key={item.id} {...item} autoFocus={i === 0} />
            ))}
          </box>
          <box flexDirection="row" gap={1}>
            {gridItems.slice(3, 6).map((item) => (
              <GridCell key={item.id} {...item} />
            ))}
          </box>
        </box>
        <FocusGridStatusBar />
      </box>
    </FocusProvider>
  )
}
