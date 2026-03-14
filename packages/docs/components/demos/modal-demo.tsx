// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState } from "react"
import { DemoWindow } from "@/components/ui/demo-window"
import { Modal, StatusBar, textStyle, useTheme } from "@gridland/ui"
import { useKeyboard } from "@opentui/react"

function ModalApp() {
  const theme = useTheme()
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
        <Modal title="Example Modal" useKeyboard={useKeyboard} onClose={() => setIsOpen(false)}>
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

export default function ModalDemo() {
  return (
    <DemoWindow title="Modal" tuiStyle={{ width: "100%", height: 200 }}>
      <ModalApp />
    </DemoWindow>
  )
}
