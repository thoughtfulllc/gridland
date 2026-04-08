import { FixtureWrapper } from "../fixture-wrapper"
import { StatusBar } from "../../../../packages/ui/components/status-bar/status-bar"

export function StatusBarFixture() {
  return (
    <FixtureWrapper cols={70} rows={6}>
      <box padding={1} flexDirection="column" gap={1}>
        <StatusBar
          items={[
            { key: "Tab", label: "switch focus" },
            { key: "\u2190\u2192", label: "navigate" },
            { key: "q", label: "quit" },
          ]}
        />
        <StatusBar
          extra="main.ts"
          items={[
            { key: "Ctrl+S", label: "save" },
            { key: "Ctrl+Q", label: "quit" },
          ]}
        />
      </box>
    </FixtureWrapper>
  )
}
