// @ts-nocheck — Gridland intrinsic elements conflict with React's HTML/SVG types
import { FixtureWrapper } from "../fixture-wrapper"
import { MultiSelect } from "../../../../packages/ui/components/multi-select/multi-select"
import { GridlandProvider } from "../../../../packages/ui/components/provider/provider"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/components/theme"

const items = [
  { label: "TypeScript", value: "ts", group: "Languages" },
  { label: "JavaScript", value: "js", group: "Languages" },
  { label: "Python", value: "py", group: "Languages" },
  { label: "React", value: "react", group: "Frameworks" },
  { label: "Vue", value: "vue", group: "Frameworks" },
]

export function MultiSelectFixture() {
  return (
    <FixtureWrapper cols={40} rows={14}>
      <ThemeProvider theme={darkTheme}>
        <GridlandProvider>
          <MultiSelect
            items={items}
            title="Technologies"
            defaultSelected={["ts", "react"]}
          />
        </GridlandProvider>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
