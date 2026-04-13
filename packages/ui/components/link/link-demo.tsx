import { useState } from "react"
import { Link, type UnderlineStyle } from "./link"
import { StatusBar } from "@/registry/gridland/ui/status-bar/status-bar"
import { textStyle } from "@/registry/gridland/lib/text-style"
import { useKeyboardContext } from "@/registry/gridland/ui/provider/provider"

const MODES: UnderlineStyle[] = ["solid", "dashed", "dotted", "none"]

export interface LinkDemoProps {
  url?: string
  label?: string
  useKeyboard?: (handler: (event: any) => void) => void
}

export function LinkDemo({
  url = "https://opentui.com",
  label = "Visit opentui.com",
  useKeyboard: useKeyboardProp,
}: LinkDemoProps) {
  const useKeyboard = useKeyboardContext(useKeyboardProp)
  const [modeIndex, setModeIndex] = useState(0)
  const mode = MODES[modeIndex]

  useKeyboard?.((event: any) => {
    if (event.name === "right") {
      setModeIndex((i) => (i + 1) % MODES.length)
    } else if (event.name === "left") {
      setModeIndex((i) => (i - 1 + MODES.length) % MODES.length)
    }
  })

  return (
    <box flexDirection="column" gap={1}>
      <Link url={url} underline={mode}>{label}</Link>
      <StatusBar
        extra={<span style={textStyle({ bold: true })}>{mode.padEnd(6)}</span>}
        items={[
          { key: "\u2190\u2192", label: "underline style" },
        ]}
      />
    </box>
  )
}
