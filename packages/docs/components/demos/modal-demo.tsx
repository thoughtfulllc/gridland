// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { TUI } from "@polyterm.io/web"
import { MacWindow } from "@/components/ui/mac-window"
import { Modal, StatusBar, textStyle } from "@polyterm.io/ui"
import { useKeyboard } from "@opentui/react"

function ModalApp() {
  const [isOpen, setIsOpen] = useState(false)

  useKeyboard((event) => {
    if (!isOpen && event.name === "m") {
      setIsOpen(true)
    }
    if (isOpen && (event.name === "q" || event.name === "escape")) {
      setIsOpen(false)
    }
  })

  if (isOpen) {
    return (
      <box flexDirection="column" flexGrow={1}>
        <Modal title="Example Modal" borderColor="blue" useKeyboard={useKeyboard} onClose={() => setIsOpen(false)}>
          <box paddingX={1} flexDirection="column">
            <text>This is a modal overlay component.</text>
            <text> </text>
            <text style={textStyle({ dim: true })}>It stretches to fill the full terminal height.</text>
          </box>
        </Modal>
        <StatusBar items={[{ key: "q", label: "close" }]} />
      </box>
    )
  }

  return (
    <box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center">
      <text>
        <span style={textStyle({ dim: true })}>Press </span>
        <span style={textStyle({ inverse: true, bold: true })}> m </span>
        <span style={textStyle({ dim: true })}> to open modal</span>
      </text>
    </box>
  )
}

export default function ModalDemo() {
  return (
    <MacWindow title="Modal">
      <TUI style={{ width: "100%", height: 200 }}>
        <ModalApp />
      </TUI>
    </MacWindow>
  )
}
