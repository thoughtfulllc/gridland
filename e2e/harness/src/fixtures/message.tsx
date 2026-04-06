// @ts-nocheck — Gridland intrinsic elements conflict with React's HTML/SVG types
import { FixtureWrapper } from "../fixture-wrapper"
import { Message, MessageContent, MessageText } from "../../../../packages/ui/components/message/message"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/components/theme"

export function MessageFixture() {
  return (
    <FixtureWrapper cols={60} rows={12}>
      <ThemeProvider theme={darkTheme}>
        <box flexDirection="column" gap={1}>
          <Message role="user">
            <MessageContent>
              <MessageText>Hello, how are you?</MessageText>
            </MessageContent>
          </Message>
          <Message role="assistant">
            <MessageContent>
              <MessageText>I'm doing well! How can I help you today?</MessageText>
            </MessageContent>
          </Message>
        </box>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
