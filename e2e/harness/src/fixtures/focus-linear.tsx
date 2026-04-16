import { FixtureWrapper } from "../fixture-wrapper"
import { useInteractive, FocusProvider } from "@gridland/utils"
import { ThemeProvider, darkTheme, useFocusBorderStyle } from "../../../../packages/ui/lib/theme"

function FocusBox({ id, label, autoFocus }: { id: string; label: string; autoFocus?: boolean }) {
  const { isFocused, isSelected, isAnySelected, focusRef } = useInteractive({
    id,
    autoFocus,
    selectable: true,
  })
  const { borderColor, borderStyle } = useFocusBorderStyle({ isFocused, isSelected, isAnySelected })

  const state = isSelected ? "selected" : isFocused ? "focused" : "idle"

  return (
    <box
      ref={focusRef}
      border
      borderStyle={borderStyle}
      borderColor={borderColor}
      paddingX={1}
      height={3}
    >
      <text fg="#cdd6f4">{label}: {state}</text>
    </box>
  )
}

export function FocusLinearFixture() {
  return (
    <FixtureWrapper cols={30} rows={12}>
      <ThemeProvider theme={darkTheme}>
        <FocusProvider selectable>
          <box flexDirection="column" gap={0}>
            <FocusBox id="a" label="Box A" autoFocus />
            <FocusBox id="b" label="Box B" />
            <FocusBox id="c" label="Box C" />
          </box>
        </FocusProvider>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
