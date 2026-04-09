import { useState } from "react"
import { useKeyboard } from "@gridland/utils"
import { FixtureWrapper } from "../fixture-wrapper"
import { SelectInput } from "../../../../packages/ui/components/select-input/select-input"

const selectItems = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
  { label: "Rust", value: "rs" },
]

export function SelectInputInteractiveFixture() {
  const [selected, setSelected] = useState<string | undefined>()
  return (
    <FixtureWrapper cols={40} rows={10}>
      <box padding={1} flexDirection="column" gap={1}>
        <text fg="#d8dee9" bold>Choose a language:</text>
        <SelectInput
          items={selectItems}
          title="Select"
          useKeyboard={useKeyboard}
          onSubmit={(value) => setSelected(value as string)}
        />
        {selected && <text fg="#a3be8c">Selected: {selected}</text>}
      </box>
    </FixtureWrapper>
  )
}
