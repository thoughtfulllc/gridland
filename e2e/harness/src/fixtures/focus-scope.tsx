import { FixtureWrapper } from "../fixture-wrapper"
import { useFocus, FocusProvider, FocusScope } from "@gridland/utils"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/components/theme"

function OuterItem({ id, label, autoFocus }: { id: string; label: string; autoFocus?: boolean }) {
  const { isFocused, isSelected, focusRef } = useFocus({ id, autoFocus, selectable: true })

  const state = isSelected ? "selected" : isFocused ? "focused" : "idle"

  return (
    <box ref={focusRef} flexDirection="column">
      <box
        border
        borderStyle="single"
        borderColor={isSelected ? "#a6e3a1" : isFocused ? "#89b4fa" : "#45475a"}
        paddingX={1}
        height={3}
      >
        <text fg="#cdd6f4">{label}: {state}</text>
      </box>
      {isSelected && (
        <FocusScope trap selectable autoFocus>
          <box flexDirection="column" paddingLeft={2}>
            <InnerItem id={`${id}-inner-1`} label="Inner 1" />
            <InnerItem id={`${id}-inner-2`} label="Inner 2" />
          </box>
        </FocusScope>
      )}
    </box>
  )
}

function InnerItem({ id, label }: { id: string; label: string }) {
  const { isFocused, focusRef } = useFocus({ id })

  return (
    <box
      ref={focusRef}
      border
      borderStyle="single"
      borderColor={isFocused ? "#f9e2af" : "#45475a"}
      paddingX={1}
      height={3}
    >
      <text fg={isFocused ? "#f9e2af" : "#6c7086"}>{label}{isFocused ? " *" : ""}</text>
    </box>
  )
}

export function FocusScopeFixture() {
  return (
    <FixtureWrapper cols={40} rows={16}>
      <ThemeProvider theme={darkTheme}>
        <FocusProvider selectable>
          <box flexDirection="column">
            <OuterItem id="a" label="Item A" autoFocus />
            <OuterItem id="b" label="Item B" />
          </box>
        </FocusProvider>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
