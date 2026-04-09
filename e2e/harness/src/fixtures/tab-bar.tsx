import { FixtureWrapper } from "../fixture-wrapper"
import { TabBar } from "../../../../packages/ui/components/tab-bar/tab-bar"

export function TabBarFixture() {
  return (
    <FixtureWrapper cols={60} rows={6}>
      <box padding={1} flexDirection="column" gap={1}>
        <TabBar label="View" options={["Files", "Search", "Git"]} selectedIndex={0} activeColor="cyan" />
        <TabBar options={["Tab1", "Tab2", "Tab3"]} selectedIndex={1} focused={false} />
      </box>
    </FixtureWrapper>
  )
}
