import { FixtureWrapper } from "../fixture-wrapper"
import { Link } from "../../../../packages/ui/components/link/link"

export function LinkFixture() {
  return (
    <FixtureWrapper cols={50} rows={6}>
      <box padding={1} flexDirection="column" gap={1}>
        <text fg="#d8dee9">Click the link below:</text>
        <Link url="https://opentui.com">Visit opentui.com</Link>
      </box>
    </FixtureWrapper>
  )
}
