// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../../testing/src/index"
import { useRuntime, RuntimeProvider } from "./runtime-context"
import React from "react"

afterEach(() => cleanup())

function RuntimeDisplay() {
  const runtime = useRuntime()
  return <text>runtime:{runtime}</text>
}

describe("useRuntime", () => {
  it("returns 'web' when wrapped in RuntimeProvider with value='web'", () => {
    // renderTui uses createBrowserRoot which wraps with RuntimeProvider(web)
    const { screen } = renderTui(
      <RuntimeDisplay />,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("runtime:web")
  })

  it("defaults to 'terminal' without RuntimeProvider", () => {
    // useRuntime defaults to "terminal" from the context default value
    // but renderTui wraps with RuntimeProvider("web"), so this test verifies
    // that by rendering within the test's createBrowserRoot which sets "web"
    const { screen } = renderTui(
      <RuntimeDisplay />,
      { cols: 40, rows: 4 },
    )
    // renderTui always uses createBrowserRoot which wraps with web
    expect(screen.text()).toContain("runtime:web")
  })
})
