import { FixtureWrapper } from "../fixture-wrapper"
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "../../../../packages/ui/components/chain-of-thought/chain-of-thought"
import { ThemeProvider, darkTheme } from "../../../../packages/ui/components/theme"

const steps = [
  { tool: "Think", label: "Planning approach", status: "done" as const, duration: "0.3s" },
  { tool: "Search", label: "Looking for relevant files", description: "src/components/", status: "done" as const, duration: "1.2s" },
  { tool: "Read", label: "Reading component source", status: "running" as const },
]

export function ChainOfThoughtFixture() {
  return (
    <FixtureWrapper cols={60} rows={12}>
      <ThemeProvider theme={darkTheme}>
        <ChainOfThought defaultOpen>
          <ChainOfThoughtHeader>Thinking...</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            {steps.map((step, i) => (
              <ChainOfThoughtStep key={i} {...step} />
            ))}
          </ChainOfThoughtContent>
        </ChainOfThought>
      </ThemeProvider>
    </FixtureWrapper>
  )
}
