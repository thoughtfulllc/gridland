// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../testing/src/index"
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "./chain-of-thought"

afterEach(() => cleanup())

describe("ChainOfThought behavior", () => {
  // ── Header & open/close ───────────────────────────────────────────

  it("renders collapsed arrow when closed", () => {
    const { screen } = renderTui(
      <ChainOfThought defaultOpen={false}>
        <ChainOfThoughtHeader />
      </ChainOfThought>,
      { cols: 50, rows: 5 },
    )
    expect(screen.text()).toContain("▶")
  })

  it("renders expanded arrow when open", () => {
    const { screen } = renderTui(
      <ChainOfThought open={true}>
        <ChainOfThoughtHeader />
      </ChainOfThought>,
      { cols: 50, rows: 5 },
    )
    expect(screen.text()).toContain("▼")
  })

  it("renders default header text", () => {
    const { screen } = renderTui(
      <ChainOfThought>
        <ChainOfThoughtHeader />
      </ChainOfThought>,
      { cols: 50, rows: 5 },
    )
    expect(screen.text()).toContain("Thought for")
  })

  it("renders duration in header", () => {
    const { screen } = renderTui(
      <ChainOfThought>
        <ChainOfThoughtHeader duration="3.2s" />
      </ChainOfThought>,
      { cols: 50, rows: 5 },
    )
    expect(screen.text()).toContain("3.2s")
  })

  it("renders custom header children", () => {
    const { screen } = renderTui(
      <ChainOfThought>
        <ChainOfThoughtHeader>Reasoning for</ChainOfThoughtHeader>
      </ChainOfThought>,
      { cols: 50, rows: 5 },
    )
    expect(screen.text()).toContain("Reasoning for")
  })

  // ── Content visibility ────────────────────────────────────────────

  it("shows children when open", () => {
    const { screen } = renderTui(
      <ChainOfThought open={true}>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <text>visible content</text>
        </ChainOfThoughtContent>
      </ChainOfThought>,
      { cols: 50, rows: 5 },
    )
    expect(screen.text()).toContain("visible content")
  })

  it("hides children when closed", () => {
    const { screen } = renderTui(
      <ChainOfThought defaultOpen={false}>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <text>hidden content</text>
        </ChainOfThoughtContent>
      </ChainOfThought>,
      { cols: 50, rows: 5 },
    )
    expect(screen.text()).not.toContain("hidden content")
  })

  it("uncontrolled defaults to closed", () => {
    const { screen } = renderTui(
      <ChainOfThought>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <text>should be hidden</text>
        </ChainOfThoughtContent>
      </ChainOfThought>,
      { cols: 50, rows: 5 },
    )
    expect(screen.text()).not.toContain("should be hidden")
    expect(screen.text()).toContain("▶")
  })

  it("defaultOpen=true shows content", () => {
    const { screen } = renderTui(
      <ChainOfThought defaultOpen={true}>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <text>visible by default</text>
        </ChainOfThoughtContent>
      </ChainOfThought>,
      { cols: 50, rows: 5 },
    )
    expect(screen.text()).toContain("visible by default")
    expect(screen.text()).toContain("▼")
  })

  // ── Steps ─────────────────────────────────────────────────────────

  it("renders done step with filled dot", () => {
    const { screen } = renderTui(
      <ChainOfThought open={true}>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Analyzing" status="done" isLast />
        </ChainOfThoughtContent>
      </ChainOfThought>,
      { cols: 50, rows: 8 },
    )
    expect(screen.text()).toContain("●")
  })

  it("renders pending step with empty dot", () => {
    const { screen } = renderTui(
      <ChainOfThought open={true}>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Waiting" status="pending" isLast />
        </ChainOfThoughtContent>
      </ChainOfThought>,
      { cols: 50, rows: 8 },
    )
    expect(screen.text()).toContain("○")
  })

  it("renders step label", () => {
    const { screen } = renderTui(
      <ChainOfThought open={true}>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Searching files" status="done" isLast />
        </ChainOfThoughtContent>
      </ChainOfThought>,
      { cols: 50, rows: 8 },
    )
    expect(screen.text()).toContain("Searching files")
  })

  it("renders step description", () => {
    const { screen } = renderTui(
      <ChainOfThought open={true}>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Read" description="package.json" status="done" isLast />
        </ChainOfThoughtContent>
      </ChainOfThought>,
      { cols: 50, rows: 8 },
    )
    expect(screen.text()).toContain("package.json")
  })

  it("renders pipe connector when not last", () => {
    const { screen } = renderTui(
      <ChainOfThought open={true}>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Step 1" status="done" />
          <ChainOfThoughtStep label="Step 2" status="done" isLast />
        </ChainOfThoughtContent>
      </ChainOfThought>,
      { cols: 50, rows: 10 },
    )
    expect(screen.text()).toContain("│")
  })

  it("renders step children as output", () => {
    const { screen } = renderTui(
      <ChainOfThought open={true}>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Search" status="done" isLast>
            found 3 results
          </ChainOfThoughtStep>
        </ChainOfThoughtContent>
      </ChainOfThought>,
      { cols: 50, rows: 10 },
    )
    expect(screen.text()).toContain("found 3 results")
  })

  it("renders error step with filled dot", () => {
    const { screen } = renderTui(
      <ChainOfThought open={true}>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Failed step" status="error" isLast />
        </ChainOfThoughtContent>
      </ChainOfThought>,
      { cols: 50, rows: 8 },
    )
    expect(screen.text()).toContain("●")
    expect(screen.text()).toContain("Failed step")
  })

  it("renders custom icon when provided", () => {
    const { screen } = renderTui(
      <ChainOfThought open={true}>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Custom" icon="★" status="done" isLast />
        </ChainOfThoughtContent>
      </ChainOfThought>,
      { cols: 50, rows: 8 },
    )
    expect(screen.text()).toContain("★")
  })

  // ── Controlled / uncontrolled ──────────────────────────────────────

  it("fires onOpenChange in uncontrolled mode", () => {
    const handler = { called: false, value: false }
    const { screen } = renderTui(
      <ChainOfThought defaultOpen={false} onOpenChange={(v) => { handler.called = true; handler.value = v }}>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <text>content</text>
        </ChainOfThoughtContent>
      </ChainOfThought>,
      { cols: 50, rows: 5 },
    )
    // Content should be hidden initially
    expect(screen.text()).not.toContain("content")
  })

  it("hides pipe connector when isLast is true", () => {
    const { screen } = renderTui(
      <ChainOfThought open={true}>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Only step" status="done" isLast />
        </ChainOfThoughtContent>
      </ChainOfThought>,
      { cols: 50, rows: 8 },
    )
    const text = screen.text()
    const lines = text.split("\n")
    const stepLineIndex = lines.findIndex(l => l.includes("Only step"))
    const linesAfterStep = lines.slice(stepLineIndex + 1)
    const hasPipeAfter = linesAfterStep.some(l => l.trim() === "│")
    expect(hasPipeAfter).toBe(false)
  })
})
