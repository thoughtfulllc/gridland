// @ts-nocheck — Gridland intrinsic elements conflict with React's HTML/SVG types
import { useState } from "react"
import { useKeyboard } from "@gridland/utils"
import { FixtureWrapper } from "../fixture-wrapper"
import { MultiSelect } from "../../../../packages/ui/components/multi-select/multi-select"
import { GridlandProvider } from "../../../../packages/ui/components/provider/provider"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/components/theme"

const items = [
  { label: "TypeScript", value: "ts" },
  { label: "JavaScript", value: "js" },
  { label: "Python", value: "py" },
  { label: "Rust", value: "rs" },
  { label: "Go", value: "go", disabled: true },
]

export function MultiSelectInteractiveFixture() {
  const [selected, setSelected] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  return (
    <FixtureWrapper cols={40} rows={14}>
      <ThemeProvider theme={darkTheme}>
        <GridlandProvider>
          <box flexDirection="column" gap={1}>
            <MultiSelect
              items={items}
              title="Select Languages"
              selected={selected}
              onChange={setSelected}
              onSubmit={() => setSubmitted(true)}
              useKeyboard={useKeyboard}
              enableSelectAll
              enableClear
            />
            <text fg="#a6e3a1">Count: {selected.length}</text>
            {submitted && <text fg="#89b4fa">Submitted</text>}
          </box>
        </GridlandProvider>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
