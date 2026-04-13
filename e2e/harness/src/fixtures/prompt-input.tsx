import { FixtureWrapper } from "../fixture-wrapper"
import { PromptInput } from "../../../../packages/ui/components/prompt-input/prompt-input"
import { GridlandProvider } from "../../../../packages/ui/components/provider/provider"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/lib/theme"

export function PromptInputFixture() {
  return (
    <FixtureWrapper cols={60} rows={8}>
      <ThemeProvider theme={darkTheme}>
        <GridlandProvider>
          <PromptInput
            placeholder="Type a message..."
            prompt="> "
            focus
          />
        </GridlandProvider>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
