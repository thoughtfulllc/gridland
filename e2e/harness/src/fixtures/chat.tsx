// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { FixtureWrapper } from "../fixture-wrapper"
import { ChatPanel } from "../../../../packages/polyterm-ui/components/chat/chat"

export function ChatFixture() {
  return (
    <FixtureWrapper cols={60} rows={14}>
      <ChatPanel
        messages={[
          { id: "1", role: "user", content: "Hello, can you help me?" },
          { id: "2", role: "assistant", content: "Sure! Let me look into that." },
          { id: "3", role: "user", content: "Can you read my file?" },
        ]}
        activeToolCalls={[
          { id: "t1", title: "Read file", status: "in_progress" },
          { id: "t2", title: "Edit file", status: "completed" },
        ]}
        streamingText="Reading the file now"
        onSendMessage={() => {}}
      />
    </FixtureWrapper>
  )
}
