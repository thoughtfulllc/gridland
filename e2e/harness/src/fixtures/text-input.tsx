import { FixtureWrapper } from "../fixture-wrapper"
import { TextInput } from "../../../../packages/ui/components/text-input/text-input"

export function TextInputFixture() {
  return (
    <FixtureWrapper cols={50} rows={6}>
      <box padding={1} flexDirection="column" gap={1}>
        <text fg="#d8dee9" bold>Enter your name:</text>
        <TextInput value="" placeholder="Type something..." prompt="> " />
      </box>
    </FixtureWrapper>
  )
}
