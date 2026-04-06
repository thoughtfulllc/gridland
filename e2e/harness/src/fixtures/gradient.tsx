// @ts-nocheck — Gridland intrinsic elements conflict with React's HTML/SVG types
import { FixtureWrapper } from "../fixture-wrapper"
import { Gradient } from "../../../../packages/ui/components/gradient/gradient"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/components/theme"

export function GradientFixture() {
  return (
    <FixtureWrapper cols={50} rows={4}>
      <ThemeProvider theme={darkTheme}>
        <box flexDirection="column">
          <Gradient name="rainbow">Hello Gridland World!</Gradient>
          <Gradient name="pastel">Gradient text rendering</Gradient>
        </box>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
