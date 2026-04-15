// @ts-nocheck
"use client"
import { FocusProvider, useFocus, useFocusedShortcuts } from "@gridland/utils"
import { MultiSelect, StatusBar, useFocusBorderStyle } from "@gridland/ui"

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
  const { isFocused, isSelected, isAnySelected, focusRef } = useFocus({ id })
  const { borderColor, borderStyle } = useFocusBorderStyle({ isFocused, isSelected, isAnySelected })

  return (
    <box ref={focusRef} border borderStyle={borderStyle} borderColor={borderColor} flexGrow={1}>
      <box flexDirection="column" paddingX={1} flexGrow={1}>
        <MultiSelect
          focusId={id}
          autoFocus={autoFocus}
          items={items}
          title={title}
          allowEmpty
          enableSelectAll={false}
          enableClear={false}
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
