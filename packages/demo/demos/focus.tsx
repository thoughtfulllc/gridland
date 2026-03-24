// @ts-nocheck
"use client"
import { useState, useRef, useCallback } from "react"
import { useKeyboard, useFocus, FocusProvider, useShortcuts, useFocusedShortcuts } from "@gridland/utils"
import { StatusBar, MultiSelect } from "@gridland/ui"

const focusMultiSelects = [
  {
    id: "language",
    title: "Language",
    items: [
      { label: "TypeScript", value: "ts" },
      { label: "JavaScript", value: "js" },
      { label: "Python", value: "py" },
      { label: "Rust", value: "rs" },
    ],
  },
  {
    id: "framework",
    title: "Framework",
    items: [
      { label: "React", value: "react" },
      { label: "Vue", value: "vue" },
      { label: "Svelte", value: "svelte" },
      { label: "Solid", value: "solid" },
    ],
  },
  {
    id: "runtime",
    title: "Runtime",
    items: [
      { label: "Bun", value: "bun" },
      { label: "Node", value: "node" },
      { label: "Deno", value: "deno" },
    ],
  },
]

function FocusMultiSelectPanel({ id, title, items, autoFocus }: {
  id: string
  title: string
  items: { label: string; value: string }[]
  autoFocus?: boolean
}) {
  const { isFocused, isSelected, isAnySelected, focusId, focusRef } = useFocus({ id, autoFocus })
  const multiSelectHandlerRef = useRef<((event: any) => void) | null>(null)

  const captureKeyboard = useCallback((handler: (event: any) => void) => {
    multiSelectHandlerRef.current = handler
  }, [])

  useKeyboard((event) => {
    multiSelectHandlerRef.current?.(event)
  }, { focusId, selectedOnly: true })

  useShortcuts(
    isSelected
      ? [{ key: "↑↓", label: "move" }, { key: "enter", label: "toggle" }, { key: "esc", label: "back" }]
      : [{ key: "←→", label: "navigate" }, { key: "tab", label: "cycle" }, { key: "enter", label: "select" }],
    focusId,
  )

  const borderStyle = isSelected ? "rounded" as const
    : isFocused ? "dashed" as const
    : "rounded" as const
  const borderColor = isSelected ? "#818cf8"
    : isAnySelected ? "transparent"
    : isFocused ? "#6366f1"
    : "#3b3466"

  return (
    <box ref={focusRef} border borderStyle={borderStyle} borderColor={borderColor} flexGrow={1}>
      <box flexDirection="column" paddingX={1}>
        <MultiSelect
          items={items}
          title={title}
          allowEmpty
          enableSelectAll={false}
          enableClear={false}
          highlightColor={isSelected ? "#a5b4fc" : "#6366f1"}
          checkboxColor="#818cf8"
          useKeyboard={captureKeyboard}
        />
      </box>
    </box>
  )
}

function FocusNavStatusBar() {
  const shortcuts = useFocusedShortcuts()
  return (
    <box paddingX={1} paddingBottom={1}>
      <StatusBar items={shortcuts} />
    </box>
  )
}

export function FocusApp() {
  return (
    <FocusProvider selectable>
      <box flexDirection="column" flexGrow={1}>
        <box flexDirection="row" gap={1} padding={1} flexGrow={1}>
          {focusMultiSelects.map((panel, i) => (
            <FocusMultiSelectPanel
              key={panel.id}
              id={panel.id}
              title={panel.title}
              items={panel.items}
              autoFocus={i === 0}
            />
          ))}
        </box>
        <FocusNavStatusBar />
      </box>
    </FocusProvider>
  )
}
