// @ts-nocheck — Gridland intrinsic elements conflict with React's HTML/SVG types
import { FixtureWrapper } from "../fixture-wrapper"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/components/theme"

export function EdgeCasesFixture() {
  return (
    <FixtureWrapper cols={40} rows={16}>
      <ThemeProvider theme={darkTheme}>
        <box flexDirection="column" gap={1}>
          {/* Empty box — should not crash */}
          <box border borderStyle="single" borderColor="#45475a" height={3}>
          </box>

          {/* Very long text — should truncate or wrap */}
          <box width={20} overflow="hidden">
            <text fg="#cdd6f4">This is a very long line of text that should be truncated at the container boundary</text>
          </box>

          {/* Box with zero-height content */}
          <box border borderStyle="single" borderColor="#585b70">
            <text fg="#a6e3a1">After empty</text>
          </box>

          {/* Nested empty boxes */}
          <box>
            <box>
              <box>
                <text fg="#f9e2af">Deep nesting OK</text>
              </box>
            </box>
          </box>
        </box>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
