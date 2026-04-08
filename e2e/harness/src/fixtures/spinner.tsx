import { FixtureWrapper } from "../fixture-wrapper"
import { Spinner } from "../../../../packages/ui/components/spinner/spinner"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/components/theme"

export function SpinnerFixture() {
  return (
    <FixtureWrapper cols={40} rows={10}>
      <ThemeProvider theme={darkTheme}>
        <box flexDirection="column" gap={1} padding={1}>
          <Spinner variant="dots" text="Loading..." />
          <Spinner variant="pulse" text="Processing..." />
          <Spinner variant="meter" text="Building..." />
          <Spinner status="success" text="Done" />
          <Spinner status="error" text="Failed" />
        </box>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
