// @ts-nocheck
"use client"
import { useState } from "react"
import { useKeyboard } from "@gridland/utils"
import { Modal, StatusBar, textStyle, useTheme } from "@gridland/ui"

export function ModalApp() {
  const theme = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  useKeyboard((event) => {
    if (!isOpen && event.name === "m") setIsOpen(true)
    if (isOpen && (event.name === "q" || event.name === "escape")) setIsOpen(false)
  })

  if (isOpen) {
    return (
      <box flexDirection="column" flexGrow={1}>
        <Modal title="Example Modal" onClose={() => setIsOpen(false)}>
          <box paddingX={1} flexDirection="column">
            <text style={textStyle({ fg: theme.foreground })}>This is a modal overlay component.</text>
            <text> </text>
            <text style={textStyle({ dim: true, fg: theme.muted })}>It stretches to fill the full terminal height.</text>
          </box>
        </Modal>
        <box paddingX={1} paddingBottom={1}>
          <StatusBar items={[{ key: "q", label: "close" }]} />
        </box>
      </box>
    )
  }

  return (
    <box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center">
      <text>
        <span style={textStyle({ dim: true, fg: theme.muted })}>Press </span>
        <span style={textStyle({ bold: true, fg: theme.background, bg: theme.muted })}> m </span>
        <span style={textStyle({ dim: true, fg: theme.muted })}> to open modal</span>
      </text>
    </box>
  )
}
