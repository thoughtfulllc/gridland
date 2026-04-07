// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { useState } from "react"
import { renderTui, cleanup } from "../../../testing/src/index"
import { useKeyboard } from "@gridland/utils"
import { GridlandProvider } from "../provider/provider"
import { TabBar, Tabs, TabsList, TabsTrigger, TabsContent } from "./tab-bar"

afterEach(() => cleanup())

function flushN(flush: () => void) {
  flush(); flush(); flush(); flush()
}

async function settle(flush: () => void) {
  flushN(flush)
  await new Promise(resolve => setTimeout(resolve, 20))
  flushN(flush)
}

describe("TabBar behavior", () => {
  it("renders all options on one line", () => {
    const { screen } = renderTui(
      <TabBar options={["Tab1", "Tab2", "Tab3"]} selectedIndex={0} />,
      { cols: 40, rows: 3 },
    )
    const text = screen.text()
    expect(text).toContain("Tab1")
    expect(text).toContain("Tab2")
    expect(text).toContain("Tab3")
  })

  it("renders label when provided", () => {
    const { screen } = renderTui(
      <TabBar label="View" options={["One", "Two"]} selectedIndex={0} />,
      { cols: 40, rows: 3 },
    )
    expect(screen.text()).toContain("View")
  })

  it("does not render label when omitted", () => {
    const { screen } = renderTui(
      <TabBar options={["One", "Two"]} selectedIndex={0} />,
      { cols: 40, rows: 3 },
    )
    expect(screen.text()).not.toContain("View")
  })

  it("renders all options horizontally on one line", () => {
    const { screen } = renderTui(
      <TabBar label="View" options={["A", "B", "C"]} selectedIndex={0} />,
      { cols: 40, rows: 3 },
    )
    const lines = screen.text().split("\n").filter((l) => l.trim().length > 0)
    // Tab options should be on the first line, separator on the second
    expect(lines[0]).toContain("A")
    expect(lines[0]).toContain("B")
    expect(lines[0]).toContain("C")
  })

  it("handles out-of-range selectedIndex", () => {
    const { screen } = renderTui(
      <TabBar options={["One", "Two"]} selectedIndex={99} />,
      { cols: 40, rows: 3 },
    )
    const text = screen.text()
    expect(text).toContain("One")
    expect(text).toContain("Two")
  })

  it("handles empty options array", () => {
    const { screen } = renderTui(
      <TabBar label="View" options={[]} selectedIndex={0} />,
      { cols: 40, rows: 3 },
    )
    expect(screen.text()).toContain("View")
  })

  it("handles single option", () => {
    const { screen } = renderTui(
      <TabBar options={["Only"]} selectedIndex={0} />,
      { cols: 40, rows: 3 },
    )
    expect(screen.text()).toContain("Only")
  })

  it("renders empty string label", () => {
    const { screen } = renderTui(
      <TabBar label="" options={["A", "B"]} selectedIndex={0} />,
      { cols: 40, rows: 3 },
    )
    // The label element IS rendered (as empty), but visually no label text
    expect(screen.text()).toContain("A")
  })

  it("renders selected index in the middle", () => {
    const { screen } = renderTui(
      <TabBar options={["A", "B", "C"]} selectedIndex={1} />,
      { cols: 40, rows: 3 },
    )
    const text = screen.text()
    expect(text).toContain("A")
    expect(text).toContain("B")
    expect(text).toContain("C")
  })

  it("handles duplicate option strings", () => {
    const { screen } = renderTui(
      <TabBar options={["A", "A", "B"]} selectedIndex={1} />,
      { cols: 40, rows: 3 },
    )
    const text = screen.text()
    expect(text).toContain("A")
    expect(text).toContain("B")
  })
})

// ── Compound API ──────────────────────────────────────────────────────

describe("Tabs compound API", () => {
  it("renders matching TabsContent for defaultValue", () => {
    const { screen } = renderTui(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b">Tab B</TabsTrigger>
        </TabsList>
        <TabsContent value="a"><text>Content A</text></TabsContent>
        <TabsContent value="b"><text>Content B</text></TabsContent>
      </Tabs>,
      { cols: 40, rows: 6 },
    )
    expect(screen.text()).toContain("Content A")
    expect(screen.text()).not.toContain("Content B")
  })

  it("does not render non-matching TabsContent", () => {
    const { screen } = renderTui(
      <Tabs defaultValue="b">
        <TabsList>
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b">Tab B</TabsTrigger>
        </TabsList>
        <TabsContent value="a"><text>Content A</text></TabsContent>
        <TabsContent value="b"><text>Content B</text></TabsContent>
      </Tabs>,
      { cols: 40, rows: 6 },
    )
    expect(screen.text()).not.toContain("Content A")
    expect(screen.text()).toContain("Content B")
  })

  it("renders controlled value", () => {
    const { screen } = renderTui(
      <Tabs value="b">
        <TabsList>
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b">Tab B</TabsTrigger>
        </TabsList>
        <TabsContent value="a"><text>Content A</text></TabsContent>
        <TabsContent value="b"><text>Content B</text></TabsContent>
      </Tabs>,
      { cols: 40, rows: 6 },
    )
    expect(screen.text()).toContain("Content B")
    expect(screen.text()).not.toContain("Content A")
  })

  it("updates on controlled value change via rerender", () => {
    const { screen, rerender } = renderTui(
      <Tabs value="a">
        <TabsList>
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b">Tab B</TabsTrigger>
        </TabsList>
        <TabsContent value="a"><text>Content A</text></TabsContent>
        <TabsContent value="b"><text>Content B</text></TabsContent>
      </Tabs>,
      { cols: 40, rows: 6 },
    )
    expect(screen.text()).toContain("Content A")

    rerender(
      <Tabs value="b">
        <TabsList>
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b">Tab B</TabsTrigger>
        </TabsList>
        <TabsContent value="a"><text>Content A</text></TabsContent>
        <TabsContent value="b"><text>Content B</text></TabsContent>
      </Tabs>,
    )
    expect(screen.text()).toContain("Content B")
    expect(screen.text()).not.toContain("Content A")
  })

  it("renders unfocused style", () => {
    const { screen } = renderTui(
      <Tabs defaultValue="a">
        <TabsList focused={false}>
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b">Tab B</TabsTrigger>
        </TabsList>
      </Tabs>,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("Tab A")
    expect(screen.text()).toContain("Tab B")
  })

  it("hides separator when separator={false}", () => {
    const { screen: withSep } = renderTui(
      <Tabs defaultValue="a">
        <TabsList separator={true}>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
      </Tabs>,
      { cols: 40, rows: 4 },
    )
    const { screen: withoutSep } = renderTui(
      <Tabs defaultValue="a">
        <TabsList separator={false}>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
      </Tabs>,
      { cols: 40, rows: 4 },
    )
    expect(withSep.text()).toContain("─")
    expect(withoutSep.text()).not.toContain("─")
  })
})

// ── Keyboard navigation ─────────────────────────────────────────────

describe("Tabs keyboard navigation", () => {
  it("switches to next tab on right arrow", async () => {
    const { screen, keys, flush } = renderTui(
      <GridlandProvider useKeyboard={useKeyboard}>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Tab A</TabsTrigger>
            <TabsTrigger value="b">Tab B</TabsTrigger>
            <TabsTrigger value="c">Tab C</TabsTrigger>
          </TabsList>
          <TabsContent value="a"><text>Content A</text></TabsContent>
          <TabsContent value="b"><text>Content B</text></TabsContent>
          <TabsContent value="c"><text>Content C</text></TabsContent>
        </Tabs>
      </GridlandProvider>,
      { cols: 40, rows: 6 },
    )
    flushN(flush)
    expect(screen.text()).toContain("Content A")

    keys.right()
    await settle(flush)
    expect(screen.text()).toContain("Content B")
    expect(screen.text()).not.toContain("Content A")
  })

  it("switches to previous tab on left arrow", async () => {
    const { screen, keys, flush } = renderTui(
      <GridlandProvider useKeyboard={useKeyboard}>
        <Tabs defaultValue="b">
          <TabsList>
            <TabsTrigger value="a">Tab A</TabsTrigger>
            <TabsTrigger value="b">Tab B</TabsTrigger>
            <TabsTrigger value="c">Tab C</TabsTrigger>
          </TabsList>
          <TabsContent value="a"><text>Content A</text></TabsContent>
          <TabsContent value="b"><text>Content B</text></TabsContent>
          <TabsContent value="c"><text>Content C</text></TabsContent>
        </Tabs>
      </GridlandProvider>,
      { cols: 40, rows: 6 },
    )
    flushN(flush)
    expect(screen.text()).toContain("Content B")

    keys.left()
    await settle(flush)
    expect(screen.text()).toContain("Content A")
  })

  it("wraps from last to first on right arrow", async () => {
    const { screen, keys, flush } = renderTui(
      <GridlandProvider useKeyboard={useKeyboard}>
        <Tabs defaultValue="c">
          <TabsList>
            <TabsTrigger value="a">Tab A</TabsTrigger>
            <TabsTrigger value="b">Tab B</TabsTrigger>
            <TabsTrigger value="c">Tab C</TabsTrigger>
          </TabsList>
          <TabsContent value="a"><text>Content A</text></TabsContent>
          <TabsContent value="c"><text>Content C</text></TabsContent>
        </Tabs>
      </GridlandProvider>,
      { cols: 40, rows: 6 },
    )
    flushN(flush)
    expect(screen.text()).toContain("Content C")

    keys.right()
    await settle(flush)
    expect(screen.text()).toContain("Content A")
  })

  it("wraps from first to last on left arrow", async () => {
    const { screen, keys, flush } = renderTui(
      <GridlandProvider useKeyboard={useKeyboard}>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Tab A</TabsTrigger>
            <TabsTrigger value="b">Tab B</TabsTrigger>
            <TabsTrigger value="c">Tab C</TabsTrigger>
          </TabsList>
          <TabsContent value="a"><text>Content A</text></TabsContent>
          <TabsContent value="c"><text>Content C</text></TabsContent>
        </Tabs>
      </GridlandProvider>,
      { cols: 40, rows: 6 },
    )
    flushN(flush)
    expect(screen.text()).toContain("Content A")

    keys.left()
    await settle(flush)
    expect(screen.text()).toContain("Content C")
  })

  it("supports vim keys h/l", async () => {
    const { screen, keys, flush } = renderTui(
      <GridlandProvider useKeyboard={useKeyboard}>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Tab A</TabsTrigger>
            <TabsTrigger value="b">Tab B</TabsTrigger>
          </TabsList>
          <TabsContent value="a"><text>Content A</text></TabsContent>
          <TabsContent value="b"><text>Content B</text></TabsContent>
        </Tabs>
      </GridlandProvider>,
      { cols: 40, rows: 6 },
    )
    flushN(flush)

    keys.press("l")
    await settle(flush)
    expect(screen.text()).toContain("Content B")

    keys.press("h")
    await settle(flush)
    expect(screen.text()).toContain("Content A")
  })
})

// ── Controllable state ──────────────────────────────────────────────

describe("Tabs controllable state", () => {
  it("fires onValueChange in uncontrolled mode", async () => {
    let lastValue = ""
    const { keys, flush } = renderTui(
      <GridlandProvider useKeyboard={useKeyboard}>
        <Tabs defaultValue="a" onValueChange={(v) => { lastValue = v }}>
          <TabsList>
            <TabsTrigger value="a">Tab A</TabsTrigger>
            <TabsTrigger value="b">Tab B</TabsTrigger>
          </TabsList>
        </Tabs>
      </GridlandProvider>,
      { cols: 40, rows: 4 },
    )
    flushN(flush)
    keys.right()
    await settle(flush)
    expect(lastValue).toBe("b")
  })

  it("updates internal state AND fires callback in uncontrolled mode", async () => {
    let callbackValue = ""
    const { screen, keys, flush } = renderTui(
      <GridlandProvider useKeyboard={useKeyboard}>
        <Tabs defaultValue="a" onValueChange={(v) => { callbackValue = v }}>
          <TabsList>
            <TabsTrigger value="a">Tab A</TabsTrigger>
            <TabsTrigger value="b">Tab B</TabsTrigger>
          </TabsList>
          <TabsContent value="a"><text>Content A</text></TabsContent>
          <TabsContent value="b"><text>Content B</text></TabsContent>
        </Tabs>
      </GridlandProvider>,
      { cols: 40, rows: 6 },
    )
    flushN(flush)
    keys.right()
    await settle(flush)
    // Both callback fires and content switches
    expect(callbackValue).toBe("b")
    expect(screen.text()).toContain("Content B")
  })

  it("fires onValueChange in controlled mode", async () => {
    let callbackValue = ""
    const { keys, flush } = renderTui(
      <GridlandProvider useKeyboard={useKeyboard}>
        <Tabs value="a" onValueChange={(v) => { callbackValue = v }}>
          <TabsList>
            <TabsTrigger value="a">Tab A</TabsTrigger>
            <TabsTrigger value="b">Tab B</TabsTrigger>
          </TabsList>
        </Tabs>
      </GridlandProvider>,
      { cols: 40, rows: 4 },
    )
    flushN(flush)
    keys.right()
    await settle(flush)
    expect(callbackValue).toBe("b")
  })
})

// ── ActiveColor ────────────────────────────────────────────────────

describe("Tabs activeColor", () => {
  it("renders with custom activeColor without crashing", () => {
    const { screen } = renderTui(
      <Tabs defaultValue="a">
        <TabsList activeColor="#ff0000">
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b">Tab B</TabsTrigger>
        </TabsList>
      </Tabs>,
      { cols: 40, rows: 4 },
    )
    expect(screen.text()).toContain("Tab A")
    expect(screen.text()).toContain("Tab B")
  })
})

// ── Disabled tabs ──────────────────────────────────────────────────

describe("Tabs disabled triggers", () => {
  it("skips disabled tab on right arrow", async () => {
    const { screen, keys, flush } = renderTui(
      <GridlandProvider useKeyboard={useKeyboard}>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Tab A</TabsTrigger>
            <TabsTrigger value="b" disabled>Tab B</TabsTrigger>
            <TabsTrigger value="c">Tab C</TabsTrigger>
          </TabsList>
          <TabsContent value="a"><text>Content A</text></TabsContent>
          <TabsContent value="b"><text>Content B</text></TabsContent>
          <TabsContent value="c"><text>Content C</text></TabsContent>
        </Tabs>
      </GridlandProvider>,
      { cols: 40, rows: 6 },
    )
    flushN(flush)
    expect(screen.text()).toContain("Content A")

    keys.right()
    await settle(flush)
    // Should skip B (disabled) and land on C
    expect(screen.text()).toContain("Content C")
    expect(screen.text()).not.toContain("Content B")
  })

  it("skips disabled tab on left arrow", async () => {
    const { screen, keys, flush } = renderTui(
      <GridlandProvider useKeyboard={useKeyboard}>
        <Tabs defaultValue="c">
          <TabsList>
            <TabsTrigger value="a">Tab A</TabsTrigger>
            <TabsTrigger value="b" disabled>Tab B</TabsTrigger>
            <TabsTrigger value="c">Tab C</TabsTrigger>
          </TabsList>
          <TabsContent value="a"><text>Content A</text></TabsContent>
          <TabsContent value="b"><text>Content B</text></TabsContent>
          <TabsContent value="c"><text>Content C</text></TabsContent>
        </Tabs>
      </GridlandProvider>,
      { cols: 40, rows: 6 },
    )
    flushN(flush)
    expect(screen.text()).toContain("Content C")

    keys.left()
    await settle(flush)
    // Should skip B (disabled) and land on A
    expect(screen.text()).toContain("Content A")
    expect(screen.text()).not.toContain("Content B")
  })

  it("does not change tab when all are disabled", async () => {
    let lastValue = ""
    const { keys, flush } = renderTui(
      <GridlandProvider useKeyboard={useKeyboard}>
        <Tabs defaultValue="a" onValueChange={(v) => { lastValue = v }}>
          <TabsList>
            <TabsTrigger value="a" disabled>Tab A</TabsTrigger>
            <TabsTrigger value="b" disabled>Tab B</TabsTrigger>
          </TabsList>
        </Tabs>
      </GridlandProvider>,
      { cols: 40, rows: 4 },
    )
    flushN(flush)
    keys.right()
    await settle(flush)
    // Value fires but stays on "a" since findNextEnabled returns current index
    expect(lastValue).toBe("a")
  })

  it("renders disabled tab with dimmed style", () => {
    const { screen } = renderTui(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b" disabled>Tab B</TabsTrigger>
        </TabsList>
      </Tabs>,
      { cols: 40, rows: 4 },
    )
    // Both tabs render — disabled is a visual style, not hidden
    expect(screen.text()).toContain("Tab A")
    expect(screen.text()).toContain("Tab B")
  })
})
