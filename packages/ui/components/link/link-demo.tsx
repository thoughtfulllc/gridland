import { useState } from "react"
import { useInteractive, useKeyboard, useShortcuts } from "@gridland/utils"
import { Link, type UnderlineStyle } from "./link"
import { StatusBar } from "@/registry/gridland/ui/status-bar/status-bar"
import { textStyle } from "@/registry/gridland/lib/text-style"

const MODES: UnderlineStyle[] = ["solid", "dashed", "dotted", "none"]

export interface LinkDemoProps {
  url?: string
  label?: string
  /** Stable focus id. Auto-generated when omitted. */
  focusId?: string
  /** Focus this demo on mount. */
  autoFocus?: boolean
}

export function LinkDemo({
  url = "https://opentui.com",
  label = "Visit opentui.com",
  focusId,
  autoFocus,
}: LinkDemoProps) {
  const { focusId: resolvedFocusId, focusRef } = useInteractive({ id: focusId, autoFocus })
  useShortcuts([{ key: "←→", label: "underline style" }], resolvedFocusId)
  const [modeIndex, setModeIndex] = useState(0)
  const mode = MODES[modeIndex]

  useKeyboard(
    (event: any) => {
      if (event.name === "right") {
        setModeIndex((i) => (i + 1) % MODES.length)
      } else if (event.name === "left") {
        setModeIndex((i) => (i - 1 + MODES.length) % MODES.length)
      }
    },
    { focusId: resolvedFocusId },
  )

  return (
    <box ref={focusRef} flexDirection="column" gap={1}>
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
