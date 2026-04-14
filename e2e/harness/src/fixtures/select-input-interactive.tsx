import { useState } from "react"
import { FocusScope } from "@gridland/utils"
import { FixtureWrapper } from "../fixture-wrapper"
import { SelectInput } from "../../../../packages/ui/components/select-input/select-input"
import { GridlandProvider } from "../../../../packages/ui/components/provider/provider"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/lib/theme"

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
      <ThemeProvider theme={darkTheme}>
        <GridlandProvider>
          <box padding={1} flexDirection="column" gap={1}>
            <text fg="#d8dee9" bold>Choose a language:</text>
            <FocusScope trap selectable autoFocus autoSelect>
              <SelectInput
                items={selectItems}
                title="Select"
                autoFocus
                onSubmit={(value) => setSelected(value as string)}
              />
            </FocusScope>
            {selected && <text fg="#a3be8c">Selected: {selected}</text>}
          </box>
        </GridlandProvider>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
