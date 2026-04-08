import { FixtureWrapper } from "../fixture-wrapper"
import { Ascii } from "../../../../packages/ui/components/ascii/ascii"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/components/theme"

export function AsciiFixture() {
  return (
    <FixtureWrapper cols={60} rows={12}>
      <ThemeProvider theme={darkTheme}>
        <box flexDirection="column" gap={1}>
          <Ascii text="Hello" font="tiny" />
          <Ascii text="Grid" font="block" />
        </box>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
