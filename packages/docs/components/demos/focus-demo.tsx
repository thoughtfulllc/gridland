// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { StatusBar } from "@gridland/ui"
import { useKeyboard, useFocus, FocusProvider, useShortcuts, useFocusedShortcuts } from "@gridland/utils"

function FocusablePanel({ id, label, autoFocus }: { id: string; label: string; autoFocus?: boolean }) {
  const { isFocused, focusId } = useFocus({ id, autoFocus })

  useShortcuts([
    { key: "enter", label: "activate" },
    { key: "esc", label: "deselect" },
  ], focusId)

  return (
    <box
      border
      borderStyle="rounded"
      borderColor={isFocused ? "#22c55e" : "#555"}
      flexGrow={1}
      padding={1}
    >
      <text style={{ fg: isFocused ? "#22c55e" : "#888", bold: isFocused }}>
        {isFocused ? `▸ ${label} (focused)` : `  ${label}`}
      </text>
    </box>
  )
}

function FocusShortcutsBar() {
  const shortcuts = useFocusedShortcuts()
  const navShortcuts = [
    { key: "Tab", label: "next" },
    { key: "↑↓", label: "navigate" },
    ...shortcuts,
  ]
  return <StatusBar items={navShortcuts} />
}

function FocusDemoApp() {
  return (
    <FocusProvider>
      <box flexDirection="column" flexGrow={1} padding={1}>
        <text style={{ bold: true, fg: "#fff" }}>Focus Navigation Demo</text>
        <text style={{ dim: true, fg: "#888" }}>Press Tab or ↑↓ to navigate between panels</text>
        <box height={1} />
        <box flexDirection="row" gap={1} flexGrow={1}>
          <FocusablePanel id="panel1" label="Panel 1" autoFocus />
          <FocusablePanel id="panel2" label="Panel 2" />
          <FocusablePanel id="panel3" label="Panel 3" />
        </box>
        <box height={1} />
        <FocusShortcutsBar />
      </box>
    </FocusProvider>
  )
}

export default function FocusDemo() {
  return (
    <DemoWindow title="Focus & Navigation" tuiStyle={{ width: "100%", height: 200 }}>
      <FocusDemoApp />
    </DemoWindow>
  )
}
