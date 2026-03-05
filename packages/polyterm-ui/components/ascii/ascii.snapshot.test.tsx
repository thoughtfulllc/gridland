// @ts-nocheck
import { describe, it, expect, afterEach } from "bun:test"
import { renderTui, cleanup } from "../../../polyterm-testing/src/index"
import figlet from "figlet"
// @ts-ignore
import ansiShadow from "figlet/importable-fonts/ANSI Shadow.js"

figlet.parseFont("ANSI Shadow", ansiShadow)

afterEach(() => cleanup())

describe("Ascii snapshots", () => {
  it("renders figlet text", () => {
    const art = figlet.textSync("Hello", { font: "ANSI Shadow" as any })
    const lines = art.split("\n").filter((l: string) => l.trimEnd().length > 0)

    const { screen } = renderTui(
      <box flexDirection="column">
        {lines.map((line: string, i: number) => (
          <text key={i} fg="#88c0d0" bold>{line}</text>
        ))}
      </box>,
      { cols: 60, rows: 12 },
    )
    expect(screen.text()).toMatchSnapshot()
  })
})
