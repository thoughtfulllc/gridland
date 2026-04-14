import { useState } from "react"
import { FocusScope } from "@gridland/utils"
import { FixtureWrapper } from "../fixture-wrapper"
import { TextInput } from "../../../../packages/ui/components/text-input/text-input"
import { GridlandProvider } from "../../../../packages/ui/components/provider/provider"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/lib/theme"

export function TextInputInteractiveFixture() {
  const [value, setValue] = useState("")
  return (
    <FixtureWrapper cols={50} rows={8}>
      <ThemeProvider theme={darkTheme}>
        <GridlandProvider>
          <box padding={1} flexDirection="column" gap={1}>
            <text fg="#d8dee9" bold>Enter your name:</text>
            <FocusScope trap selectable autoFocus autoSelect>
              <TextInput
                placeholder="Type something..."
                prompt="> "
                value={value}
                onChange={setValue}
                autoFocus
              />
            </FocusScope>
            {value.length > 0 && <text fg="#a3be8c">You typed: {value}</text>}
          </box>
        </GridlandProvider>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
