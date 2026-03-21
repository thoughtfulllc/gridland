// @ts-nocheck
import { Modal, textStyle, useTheme } from "@gridland/ui"

interface AboutModalProps {
  onClose: () => void
  useKeyboard: any
}

export function AboutModal({ onClose, useKeyboard }: AboutModalProps) {
  const theme = useTheme()

  return (
    <Modal title="About Gridland" useKeyboard={useKeyboard} onClose={onClose}>
      <box paddingX={1} flexDirection="column" gap={1}>
        <text style={textStyle({ bold: true, fg: theme.accent })}>What is Gridland?</text>
        <text>
          Gridland renders terminal UIs to HTML5 Canvas with React.
        </text>
        <text>
          No xterm.js. No terminal emulator. Just pixels.
        </text>

        <text style={textStyle({ bold: true, fg: theme.accent })}>Features</text>
        <text>
          <span style={textStyle({ dim: true })}>{"\u2022"} </span>Canvas-rendered TUI components
        </text>
        <text>
          <span style={textStyle({ dim: true })}>{"\u2022"} </span>React reconciler with JSX
        </text>
        <text>
          <span style={textStyle({ dim: true })}>{"\u2022"} </span>Yoga flexbox layout engine
        </text>
        <text>
          <span style={textStyle({ dim: true })}>{"\u2022"} </span>Keyboard, mouse, and clipboard support
        </text>
        <text>
          <span style={textStyle({ dim: true })}>{"\u2022"} </span>Next.js and Vite plugins
        </text>

        <text style={textStyle({ bold: true, fg: theme.accent })}>Tech Stack</text>
        <text>
          React + opentui engine + yoga-layout + HTML5 Canvas
        </text>

        <text style={textStyle({ dim: true })}>
          Press q to close
        </text>
      </box>
    </Modal>
  )
}
