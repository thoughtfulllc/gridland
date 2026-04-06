// @ts-nocheck — Gridland intrinsic elements conflict with React's HTML/SVG types
import { FixtureWrapper } from "../fixture-wrapper"
import { useFocus, FocusProvider } from "@gridland/utils"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/components/theme"

function GridCell({ id, label, autoFocus }: { id: string; label: string; autoFocus?: boolean }) {
  const { isFocused, focusRef } = useFocus({ id, autoFocus })

  return (
    <box
      ref={focusRef}
      border
      borderStyle="single"
      borderColor={isFocused ? "#89b4fa" : "#45475a"}
      flexGrow={1}
      height={3}
      justifyContent="center"
    >
      <text fg={isFocused ? "#89b4fa" : "#cdd6f4"}>{label}{isFocused ? " *" : ""}</text>
    </box>
  )
}

export function FocusSpatialFixture() {
  return (
    <FixtureWrapper cols={40} rows={8}>
      <ThemeProvider theme={darkTheme}>
        <FocusProvider>
          <box flexDirection="column">
            <box flexDirection="row">
              <GridCell id="tl" label="TL" autoFocus />
              <GridCell id="tr" label="TR" />
            </box>
            <box flexDirection="row">
              <GridCell id="bl" label="BL" />
              <GridCell id="br" label="BR" />
            </box>
          </box>
        </FocusProvider>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
