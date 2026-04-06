// @ts-nocheck — Gridland intrinsic elements conflict with React's HTML/SVG types
import { FixtureWrapper } from "../fixture-wrapper"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/components/theme"

export function OverflowFixture() {
  return (
    <FixtureWrapper cols={40} rows={10}>
      <ThemeProvider theme={darkTheme}>
        <box flexDirection="column" gap={1}>
          {/* Container with overflow hidden — content should be clipped */}
          <box height={3} overflow="hidden" border borderStyle="single" borderColor="#45475a">
            <box flexDirection="column">
              <text fg="#cdd6f4">Visible line 1</text>
              <text fg="#cdd6f4">Hidden line 2</text>
              <text fg="#cdd6f4">Hidden line 3</text>
              <text fg="#cdd6f4">Hidden line 4</text>
            </box>
          </box>

          {/* Nested overflow containers */}
          <box height={4} overflow="hidden" border borderStyle="single" borderColor="#585b70">
            <box overflow="hidden" height={2}>
              <box flexDirection="column">
                <text fg="#a6e3a1">Inner visible</text>
                <text fg="#a6e3a1">Inner hidden</text>
                <text fg="#a6e3a1">Inner hidden 2</text>
              </box>
            </box>
          </box>
        </box>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
