import { FixtureWrapper } from "../fixture-wrapper"
import { SelectInput } from "../../../../packages/ui/components/select-input/select-input"

const selectItems = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
  { label: "Rust", value: "rs" },
]

export function SelectInputFixture() {
  return (
    <FixtureWrapper cols={40} rows={10}>
      <box padding={1} flexDirection="column" gap={1}>
        <text fg="#d8dee9" bold>Choose a language:</text>
        <SelectInput items={selectItems} title="Select" />
      </box>
    </FixtureWrapper>
  )
}
