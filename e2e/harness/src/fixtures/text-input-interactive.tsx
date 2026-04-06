// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { useState } from "react"
import { FixtureWrapper } from "../fixture-wrapper"
import { TextInput } from "../../../../packages/ui/components/text-input/text-input"

export function TextInputInteractiveFixture() {
  const [value, setValue] = useState("")
  return (
    <FixtureWrapper cols={50} rows={8}>
      <box padding={1} flexDirection="column" gap={1}>
        <text fg="#d8dee9" bold>Enter your name:</text>
        <TextInput
          placeholder="Type something..."
          prompt="> "
          value={value}
          onChange={setValue}
          focus
        />
        {value.length > 0 && <text fg="#a3be8c">You typed: {value}</text>}
      </box>
    </FixtureWrapper>
  )
}
