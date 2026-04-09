import { FixtureWrapper } from "../fixture-wrapper"
import { SideNav } from "../../../../packages/ui/components/side-nav/side-nav"
import { GridlandProvider } from "../../../../packages/ui/components/provider/provider"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/components/theme"

const items = [
  { id: "home", name: "Home" },
  { id: "settings", name: "Settings", suffix: "⚙" },
  { id: "messages", name: "Messages" },
  { id: "profile", name: "Profile" },
]

export function SideNavFixture() {
  return (
    <FixtureWrapper cols={60} rows={15}>
      <ThemeProvider theme={darkTheme}>
        <GridlandProvider>
          <SideNav items={items} title="App" sidebarWidth={20}>
            {({ activeItem }) => (
              <box padding={1}>
                <text fg="#cdd6f4">Content: {activeItem.name}</text>
              </box>
            )}
          </SideNav>
        </GridlandProvider>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
