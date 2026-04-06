// @ts-nocheck — Gridland intrinsic elements conflict with React's HTML/SVG types
import { useState } from "react"
import { FixtureWrapper } from "../fixture-wrapper"
import { PromptInput } from "../../../../packages/ui/components/prompt-input/prompt-input"
import { GridlandProvider } from "../../../../packages/ui/components/provider/provider"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/components/theme"

export function PromptInputInteractiveFixture() {
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [stopped, setStopped] = useState(false)

  return (
    <FixtureWrapper cols={60} rows={10}>
      <ThemeProvider theme={darkTheme}>
        <GridlandProvider>
          <box flexDirection="column" gap={1}>
            <PromptInput
              placeholder="Type a message..."
              prompt="> "
              focus
              onSubmit={(msg) => setSubmitted(msg.text)}
              onStop={() => setStopped(true)}
            />
            {submitted && <text fg="#a6e3a1">Submitted: {submitted}</text>}
            {stopped && <text fg="#f38ba8">Stopped</text>}
          </box>
        </GridlandProvider>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
