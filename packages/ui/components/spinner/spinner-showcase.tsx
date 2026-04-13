import { useState } from "react"
import { textStyle } from "@/registry/gridland/lib/text-style"
import { useTheme } from "@/registry/gridland/lib/theme"
import { useKeyboardContext } from "@/registry/gridland/ui/provider/provider"
import { StatusBar } from "@/registry/gridland/ui/status-bar/status-bar"
import { Spinner, VARIANT_NAMES } from "./spinner"

const SHOWCASE_TASKS = [
  "Installing dependencies",
  "Compiling source files",
  "Running type checker",
  "Bundling modules",
  "Optimizing assets",
]

export interface SpinnerPickerProps {
  /** Keyboard handler — pass useKeyboard from @gridland/utils */
  useKeyboard?: (handler: (event: any) => void) => void
}

export function SpinnerPicker({ useKeyboard: useKeyboardProp }: SpinnerPickerProps) {
  const theme = useTheme()
  const useKeyboard = useKeyboardContext(useKeyboardProp)
  const [selected, setSelected] = useState(0)

  useKeyboard?.((event: any) => {
    if (event.name === "left") {
      setSelected((s) => (s > 0 ? s - 1 : VARIANT_NAMES.length - 1))
    } else if (event.name === "right") {
      setSelected((s) => (s < VARIANT_NAMES.length - 1 ? s + 1 : 0))
    }
  })

  const selectedName = VARIANT_NAMES[selected]

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box padding={1} flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <Spinner variant={selectedName} color={theme.accent} />
      </box>
      <StatusBar
        items={[{ key: "←→", label: "change spinner type" }]}
        extra={<span style={textStyle({ fg: theme.accent, bold: true })}>{selectedName.padEnd(8)}</span>}
      />
    </box>
  )
}

export function SpinnerShowcase() {
  const theme = useTheme()

  return (
    <box padding={1} flexGrow={1}>
      <text>
        <span style={textStyle({ bold: true, fg: theme.primary })}>{"All variants  "}</span>
        <span style={textStyle({ dim: true })}>{VARIANT_NAMES.length} styles</span>
      </text>

      {VARIANT_NAMES.map((name, i) => {
        const task = SHOWCASE_TASKS[i] ?? "Processing"

        return (
          <box key={name} flexDirection="row">
            <text>
              <span>{"  "}</span>
              <span style={textStyle({ fg: theme.primary })}>
                {name.padEnd(12)}
              </span>
            </text>
            <Spinner variant={name} text={`${task}...`} color={theme.accent} />
          </box>
        )
      })}

    </box>
  )
}
