import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "./chain-of-thought"

afterEach(() => cleanup())

describe("ChainOfThought snapshots", () => {
  it("renders collapsed chain with header", () => {
    const { screen } = renderTui(
      <ChainOfThought defaultOpen={false}>
        <ChainOfThoughtHeader duration="2.1s" />
      </ChainOfThought>,
      { cols: 50, rows: 5 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders expanded chain with multiple steps", () => {
    const { screen } = renderTui(
      <ChainOfThought open={true}>
        <ChainOfThoughtHeader duration="4.5s" />
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Analyzing code" status="done" />
          <ChainOfThoughtStep label="Reading files" description="src/index.ts" status="done" />
          <ChainOfThoughtStep label="Generating response" status="pending" isLast />
        </ChainOfThoughtContent>
      </ChainOfThought>,
      { cols: 60, rows: 18 },
    )
    expect(screen.text()).toMatchSnapshot()
  })

  it("renders step with output children", () => {
    const { screen } = renderTui(
      <ChainOfThought open={true}>
        <ChainOfThoughtHeader duration="1.2s" />
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Search" status="done" isLast>
            found 3 matching files
          </ChainOfThoughtStep>
        </ChainOfThoughtContent>
      </ChainOfThought>,
      { cols: 50, rows: 10 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
