import { describe, test, expect } from "bun:test"
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const DEMO_DIR = join(import.meta.dir, "../..")
const CLI_PATH = join(DEMO_DIR, "bin/cli.mjs")
const DIST_PATH = join(DEMO_DIR, "dist/run.js")
const NAMES_PATH = join(DEMO_DIR, "dist/demo-names.json")

const AVAILABLE_DEMOS = [
  "gradient", "ascii", "table", "spinner", "select-input",
  "multi-select", "chat-input", "text-input", "link", "tab-bar", "status-bar",
  "modal", "primitives", "chat", "terminal", "landing",
]

function run(...args: string[]) {
  return spawnSync("node", [CLI_PATH, ...args], {
    encoding: "utf-8",
    timeout: 5000,
  })
}

describe("cli", () => {
  test("shows help with --help", () => {
    const result = run("--help")
    expect(result.status).toBe(0)
    expect(result.stdout).toContain("Usage: gridland-demo <demo-name>")
    expect(result.stdout).toContain("Available demos:")
    for (const demo of AVAILABLE_DEMOS) {
      expect(result.stdout).toContain(demo)
    }
  })

  test("shows help with -h", () => {
    const result = run("-h")
    expect(result.status).toBe(0)
    expect(result.stdout).toContain("Usage: gridland-demo <demo-name>")
  })

  test("exits with error when no args", () => {
    const result = run()
    expect(result.status).toBe(1)
    expect(result.stdout).toContain("Usage: gridland-demo <demo-name>")
  })

  test("exits with error for unknown demo", () => {
    const result = run("nonexistent")
    expect(result.status).toBe(1)
    const output = result.stdout + result.stderr
    expect(output).toContain('Unknown demo: "nonexistent"')
    expect(output).toContain("Available:")
  })
})

describe("bundle", () => {
  test("dist/run.js exists", () => {
    expect(existsSync(DIST_PATH)).toBe(true)
  })

  test("exports runDemo and demos", () => {
    const source = readFileSync(DIST_PATH, "utf-8")
    expect(source).toContain("export {")
    expect(source).toContain("demos")
    expect(source).toContain("runDemo")
  })

  test("bundles all demo apps", () => {
    const source = readFileSync(DIST_PATH, "utf-8")
    // Each demo registers with { name: "xxx", app: ... } in the demos array
    for (const name of AVAILABLE_DEMOS) {
      expect(source).toContain(`name: "${name}"`)
    }
  })

  test("inlines @gridland/ui components (not external)", () => {
    const source = readFileSync(DIST_PATH, "utf-8")
    // UI components should be inlined, not imported from @gridland/ui
    expect(source).not.toContain('from "@gridland/ui"')
    // Verify key components are present in the bundle
    expect(source).toContain("StatusBar")
    expect(source).toContain("Gradient")
    expect(source).toContain("Table")
    expect(source).toContain("Spinner")
    expect(source).toContain("SelectInput")
    expect(source).toContain("Modal")
    expect(source).toContain("ChatPanel")
    expect(source).toContain("TextInput")
    expect(source).toContain("TabBar")
  })

  test("inlines landing app components (not external)", () => {
    const source = readFileSync(DIST_PATH, "utf-8")
    expect(source).toContain("LandingApp")
    expect(source).toContain("MatrixBackground")
    expect(source).toContain("AboutModal")
    expect(source).toContain("Logo")
  })

  test("keeps runtime deps external", () => {
    const source = readFileSync(DIST_PATH, "utf-8")
    expect(source).toContain('from "react"')
    expect(source).toContain('from "@opentui/core"')
    expect(source).toContain('from "@opentui/react"')
    expect(source).toContain('from "figlet"')
  })

  test("does not contain git clone logic", () => {
    const source = readFileSync(DIST_PATH, "utf-8")
    expect(source).not.toContain("git clone")
    expect(source).not.toContain("mkdtemp")
  })

  test("demo-names.json matches canonical demo list", () => {
    const names = JSON.parse(readFileSync(NAMES_PATH, "utf-8"))
    expect(names).toEqual(AVAILABLE_DEMOS)
  })
})
