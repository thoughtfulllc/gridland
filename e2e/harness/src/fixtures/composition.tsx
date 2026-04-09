import { useState } from "react"
import { FixtureWrapper } from "../fixture-wrapper"
import { SideNav } from "../../../../packages/ui/components/side-nav/side-nav"
import { TextInput } from "../../../../packages/ui/components/text-input/text-input"
import { GridlandProvider } from "../../../../packages/ui/components/provider/provider"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/components/theme"

const items = [
  { id: "page-a", name: "Page A" },
  { id: "page-b", name: "Page B" },
]

export function CompositionFixture() {
  const [inputValue, setInputValue] = useState("")
  const [submitted, setSubmitted] = useState<string | null>(null)

  return (
    <FixtureWrapper cols={60} rows={15}>
      <ThemeProvider theme={darkTheme}>
        <GridlandProvider>
          <SideNav items={items} title="App" sidebarWidth={18}>
            {({ activeItem, isInteracting }) => (
              <box padding={1} flexDirection="column" gap={1}>
                <text fg="#cdd6f4">Page: {activeItem.name}</text>
                <text fg="#6c7086">Interacting: {isInteracting ? "yes" : "no"}</text>
                {isInteracting && (
                  <TextInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSubmit={() => { setSubmitted(inputValue); setInputValue("") }}
                    placeholder="Type here..."
                    prompt="> "
                    focus
                  />
                )}
                {submitted && <text fg="#a6e3a1">Sent: {submitted}</text>}
              </box>
            )}
          </SideNav>
        </GridlandProvider>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
