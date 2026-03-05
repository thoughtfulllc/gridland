// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { FixtureWrapper } from "../fixture-wrapper"
import { SelectInput } from "../../../../packages/polyterm-ui/components/select-input/select-input"

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
        <SelectInput items={selectItems} textColor="#d8dee9" selectedTextColor="#88c0d0" />
      </box>
    </FixtureWrapper>
  )
}
