import { useState } from "react"
import { FixtureWrapper } from "../fixture-wrapper"
import { SideNav } from "../../../../packages/ui/components/side-nav/side-nav"
import { GridlandProvider } from "../../../../packages/ui/components/provider/provider"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/components/theme"

const items = [
  { id: "home", name: "Home" },
  { id: "settings", name: "Settings" },
  { id: "messages", name: "Messages" },
  { id: "profile", name: "Profile" },
]

export function SideNavInteractiveFixture() {
  return (
    <FixtureWrapper cols={60} rows={15}>
      <ThemeProvider theme={darkTheme}>
        <GridlandProvider>
          <SideNav items={items} title="Navigation" sidebarWidth={20}>
            {({ activeItem, isInteracting }) => (
              <box padding={1} flexDirection="column">
                <text fg="#cdd6f4">Active: {activeItem.name}</text>
                <text fg="#a6e3a1">Interacting: {isInteracting ? "yes" : "no"}</text>
              </box>
            )}
          </SideNav>
        </GridlandProvider>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
