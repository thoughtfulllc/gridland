// @ts-nocheck — Gridland intrinsic elements conflict with React's HTML/SVG types
import { FixtureWrapper } from "../fixture-wrapper"
import { Message } from "../../../../packages/ui/components/message/message"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/components/theme"

export function MessageFixture() {
  return (
    <FixtureWrapper cols={60} rows={12}>
      <ThemeProvider theme={darkTheme}>
        <box flexDirection="column" gap={1}>
          <Message role="user">
            <Message.Text>Hello, how are you?</Message.Text>
          </Message>
          <Message role="assistant">
            <Message.Text>I'm doing well! How can I help you today?</Message.Text>
            <Message.Footer model="claude-3" timestamp="2m ago" />
          </Message>
        </box>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
