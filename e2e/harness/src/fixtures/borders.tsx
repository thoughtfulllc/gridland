import { FixtureWrapper } from "../fixture-wrapper"

export function BordersFixture() {
  return (
    <FixtureWrapper cols={60} rows={20}>
      <box padding={1} flexDirection="column" gap={1}>
        <box border borderStyle="single" borderColor="#5e81ac" padding={1}>
          <text fg="#d8dee9">Single border</text>
        </box>
        <box border borderStyle="double" borderColor="#a3be8c" padding={1}>
          <text fg="#d8dee9">Double border</text>
        </box>
        <box border borderStyle="rounded" borderColor="#b48ead" padding={1}>
          <text fg="#d8dee9">Round border</text>
        </box>
        <box border borderStyle="bold" borderColor="#ebcb8b" padding={1}>
          <text fg="#d8dee9">Bold border</text>
        </box>
      </box>
    </FixtureWrapper>
  )
}
