import { useState } from "react"
import { FixtureWrapper } from "../fixture-wrapper"
import { useFocus, FocusProvider, useKeyboard } from "@gridland/utils"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/lib/theme"

function FocusItem({ id, label, autoFocus, disabled }: {
  id: string
  label: string
  autoFocus?: boolean
  disabled?: boolean
}) {
  const { isFocused, focusRef } = useFocus({ id, autoFocus, disabled })

  return (
    <box
      ref={focusRef}
      border
      borderStyle="single"
      borderColor={disabled ? "#313244" : isFocused ? "#89b4fa" : "#45475a"}
      paddingX={1}
      height={3}
    >
      <text fg={disabled ? "#585b70" : isFocused ? "#89b4fa" : "#cdd6f4"}>
        {label}{disabled ? " (disabled)" : ""}{isFocused ? " *" : ""}
      </text>
    </box>
  )
}

function ToggleHandler({ onToggle }: { onToggle: () => void }) {
  useKeyboard((event: any) => {
    if (event.name === "d") onToggle()
  }, { global: true })
  return null
}

export function FocusDisabledFixture() {
  const [middleDisabled, setMiddleDisabled] = useState(true)

  return (
    <FixtureWrapper cols={35} rows={12}>
      <ThemeProvider theme={darkTheme}>
        <FocusProvider>
          <ToggleHandler onToggle={() => setMiddleDisabled((prev) => !prev)} />
          <box flexDirection="column">
            <FocusItem id="first" label="First" autoFocus />
            <FocusItem id="middle" label="Middle" disabled={middleDisabled} />
            <FocusItem id="last" label="Last" />
            <text fg="#6c7086">Press 'd' to toggle middle</text>
          </box>
        </FocusProvider>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
